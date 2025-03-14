import React, { useEffect, useState } from "react";
import { Tab, Tabs, Table, Button, Form } from "react-bootstrap";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("viewOrders");

  // Order Management States
  const [newOrder, setNewOrder] = useState({
    items: [],
    totalPrice: "",
    status: "Pending"
  });
  
  // State for item input fields
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState("");
  
  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/orders/my-orders?page=${page}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrders(data.orders);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await fetch(`http://localhost:5000/orders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOrders(orders.filter((order) => order._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // Add item to the order
  const addItemToOrder = () => {
    if (!itemName || !itemPrice) {
      alert("Item name and price are required");
      return;
    }
    
    const newItem = {
      name: itemName,
      quantity: parseInt(itemQuantity),
      price: parseFloat(itemPrice)
    };
    
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, newItem]
    });
    
    // Reset item fields
    setItemName("");
    setItemQuantity(1);
    setItemPrice("");
  };
  
  // Remove item from the order
  const removeItemFromOrder = (index) => {
    const updatedItems = [...newOrder.items];
    updatedItems.splice(index, 1);
    setNewOrder({
      ...newOrder,
      items: updatedItems
    });
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();

    if (newOrder.items.length === 0) {
      alert("Order must have at least one item.");
      return;
    }
  
    // Calculate total price if not explicitly set
    const calculatedTotalPrice = calculateTotalPrice();
    const finalTotalPrice = newOrder.totalPrice || calculatedTotalPrice;
  
    // Validate all items have required fields
    const validItems = newOrder.items.every(item => 
      item.name && item.quantity > 0 && item.price > 0
    );
  
    if (!validItems) {
      alert("All items must have a name, quantity, and price.");
      return;
    }
  
    try {
      const res = await fetch("http://localhost:5000/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          items: newOrder.items,
          totalPrice: parseFloat(finalTotalPrice),
          status: newOrder.status
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create order");
  
      // Add the new order to the list and reset form
      setOrders([...orders, data]);
      setNewOrder({
        items: [],
        totalPrice: "",
        status: "Pending"
      });
      
      // Switch to view orders tab
      setActiveTab("viewOrders");
      fetchOrders(); // Refresh the orders list
    } catch (err) {
      alert("Error adding order: " + err.message);
    }
  };

  // Calculate total price based on items
  const calculateTotalPrice = () => {
    return newOrder.items.reduce((total, item) => 
      total + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
  };

  return (
    <div className="container mt-4">
      <h2>Orders Dashboard</h2>
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="viewOrders" title="View Orders">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : (
            <>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>OrderID</th>
                    <th>Items</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>{order._id}</td>
                      <td>{order.items.map((item) => item.name).join(", ")}</td>
                      <td>${order.totalPrice.toFixed(2)}</td>
                      <td>{order.status}</td>
                      <td>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(order._id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div>
                <Button onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>Previous</Button>
                <span> Page {page} of {totalPages} </span>
                <Button onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page === totalPages}>Next</Button>
              </div>
            </>
          )}
        </Tab>
        <Tab eventKey="manageOrders" title="Manage Orders">
          <h3>Add New Order</h3>
          <Form onSubmit={handleAddOrder}>
            <h4>Add Items</h4>
            <div className="mb-3 p-3 border rounded">
              <Form.Group className="mb-2">
                <Form.Label>Item Name</Form.Label>
                <Form.Control 
                  type="text" 
                  value={itemName} 
                  onChange={(e) => setItemName(e.target.value)} 
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Quantity</Form.Label>
                <Form.Control 
                  type="number" 
                  min="1"
                  value={itemQuantity} 
                  onChange={(e) => setItemQuantity(e.target.value)} 
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Price</Form.Label>
                <Form.Control 
                  type="number" 
                  step="0.01"
                  value={itemPrice} 
                  onChange={(e) => setItemPrice(e.target.value)} 
                />
              </Form.Group>
              <Button 
                variant="primary" 
                onClick={addItemToOrder}>
                Add Item
              </Button>
            </div>
            
            {newOrder.items.length > 0 && (
              <div className="mb-3">
                <h5>Order Items:</h5>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Subtotal</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>${parseFloat(item.price).toFixed(2)}</td>
                        <td>${(item.quantity * parseFloat(item.price)).toFixed(2)}</td>
                        <td>
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => removeItemFromOrder(index)}>
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
            
            <Form.Group>
              <Form.Label>Total Price</Form.Label>
              <Form.Control 
                type="number" 
                step="0.01"
                value={newOrder.totalPrice || calculateTotalPrice()} 
                onChange={(e) => setNewOrder({ ...newOrder, totalPrice: e.target.value })} 
                required 
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Control 
                as="select" 
                value={newOrder.status} 
                onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}>
                <option value="Pending">Pending</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </Form.Control>
            </Form.Group>
            <Button type="submit" variant="success" className="mt-2">Add Order</Button>
          </Form>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Dashboard;