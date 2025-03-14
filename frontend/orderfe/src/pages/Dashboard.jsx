import React, { useEffect, useState } from "react";
import { Tab, Tabs, Table, Button, Form, Modal } from "react-bootstrap";



const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("viewOrders");
  const [isAdmin, setIsAdmin] = useState(null);
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
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editedItems, setEditedItems] = useState([]);
 
  
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("token is",token)
        if (!token) {
          setIsAdmin(false);
          return;
        }
        console.log("before api req")
        const res = await fetch("http://localhost:5000/users/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        const data = await res.json();
        setIsAdmin(data.isAdmin);
      } catch (err) {
        console.error("Error fetching user role:", err);
        setIsAdmin(false);
      }
    };
    
    fetchUserRole();
  }, []);
  
  // Fetch orders only when `isAdmin` is determined
  useEffect(() => {
    if (isAdmin !== null) {
      fetchOrders();
    }
  }, [isAdmin, page]);
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
        console.log("ADMIN",isAdmin)
      const endpoint = isAdmin
        ? `http://localhost:5000/orders/all-orders` 
        : `http://localhost:5000/orders/my-orders?page=${page}`; 
  
      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      // Handle different response formats
      if (isAdmin) {
        setOrders(data); // Admin endpoint returns array directly
        setTotalPages(1); // No pagination for admin view
      } else {
        setOrders(data.orders);
        setTotalPages(data.totalPages);
      }
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

  // Open edit modal
  const handleEdit = (order) => {
    setSelectedOrder(order);
    setEditedItems(JSON.parse(JSON.stringify(order.items))); // Deep copy items
    setShowEditModal(true);
  };
  
  // Close edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedOrder(null);
    setEditedItems([]);
  };
  
  // Update item fields in edit modal
  const handleEditItemChange = (index, field, value) => {
    const updatedItems = [...editedItems];
    updatedItems[index][field] = field === 'quantity' ? parseInt(value) : 
                                field === 'price' ? parseFloat(value) : value;
    setEditedItems(updatedItems);
  };
  
  // Submit order updates
  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    
    // Calculate new total price based on updated items
    const newTotalPrice = editedItems.reduce((total, item) => 
      total + (parseFloat(item.price) * item.quantity), 0);
    
    try {
      const res = await fetch(`http://localhost:5000/orders/${selectedOrder._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          items: editedItems,
          totalPrice: newTotalPrice,
          status: selectedOrder.status
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update order");
      
      // Update orders list
      setOrders(orders.map(order => 
        order._id === selectedOrder._id ? 
        {...order, items: editedItems, totalPrice: newTotalPrice} : 
        order
      ));
      
      handleCloseEditModal();
    } catch (err) {
      alert("Error updating order: " + err.message);
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
    
    // Calculate new total with this item added
    const newItems = [...newOrder.items, newItem];
    const calculatedTotal = newItems.reduce((total, item) => 
      total + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
    
    setNewOrder({
      ...newOrder,
      items: newItems,
      totalPrice: calculatedTotal // Update total price automatically
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
    
    // Get token from localStorage
    const token = localStorage.getItem("token");
    
    if (!token) {
      alert("Authentication required. Please log in.");
      return;
    }
    
    // Validate that we have items
    if (!newOrder.items || newOrder.items.length === 0) {
      alert("Order must have at least one item.");
      return;
    }
    
    // Validate that each item has required fields
    const validItems = newOrder.items.every(item => 
        item.name && 
        item.quantity && parseInt(item.quantity) >= 1 && 
        item.price && parseFloat(item.price) > 0
      );
    if (!validItems) {
      alert("Each item must have a name, quantity (min 1), and valid price.");
      return;
    }
    
    // Validate total price
    if (!newOrder.totalPrice || isNaN(parseFloat(newOrder.totalPrice))) {
      alert("Total price is required and must be a valid number.");
      return;
    }
    
    try {
      // Format the order data as expected by the server
      const orderData = {
        items: newOrder.items.map(item => ({
          name: item.name,
          quantity: Number(item.quantity),
          price: Number(item.price)
        })),
        totalPrice: Number(newOrder.totalPrice)
        // Note: status is automatically set to "Pending" by the server
      };
      
      console.log("Sending order data:", orderData);
      
      const response = await fetch("http://localhost:5000/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      
      // Handle the response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
      }
      
      const data = await response.json();
      console.log("Order created successfully:", data);
      
      // Update the UI
      setOrders(prevOrders => [...prevOrders, data]);
      
      // Reset the form
      setNewOrder({
        items: [],
        totalPrice: "",
        status: "Pending"
      });
      
      // Provide user feedback
      alert("Order created successfully!");
      
      // Optionally switch to view orders tab
      if (typeof setActiveTab === 'function') {
        setActiveTab("viewOrders");
      }
      
      // Optionally refresh the orders list
      if (typeof fetchOrders === 'function') {
        fetchOrders();
      }
      
    } catch (error) {
      console.error("Error creating order:", error);
      alert(error.message || "An error occurred while creating the order");
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
                        <Button variant="primary" size="sm" className="me-2" onClick={() => handleEdit(order)}>Edit</Button>
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
      
      {/* Edit Order Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <h5>Order ID: {selectedOrder._id}</h5>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {editedItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <Form.Control
                          type="text"
                          value={item.name}
                          onChange={(e) => handleEditItemChange(index, 'name', e.target.value)}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleEditItemChange(index, 'quantity', e.target.value)}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleEditItemChange(index, 'price', e.target.value)}
                        />
                      </td>
                      <td>
                        ${(item.quantity * parseFloat(item.price)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan="3" className="text-end">Total Price:</th>
                    <th>
                      ${editedItems.reduce((total, item) => total + (item.quantity * parseFloat(item.price)), 0).toFixed(2)}
                    </th>
                  </tr>
                </tfoot>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateOrder}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Dashboard;