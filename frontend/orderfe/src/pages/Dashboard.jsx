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
  const [newOrder, setNewOrder] = useState({ items: "", totalPrice: "", status: "Pending" });
  
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

  const handleAddOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newOrder),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrders([...orders, data.order]);
      setNewOrder({ items: "", totalPrice: "", status: "Pending" });
    } catch (err) {
      alert("Error adding order: " + err.message);
    }
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
            <Form.Group>
              <Form.Label>Items (comma-separated)</Form.Label>
              <Form.Control type="text" value={newOrder.items} onChange={(e) => setNewOrder({ ...newOrder, items: e.target.value })} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Total Price</Form.Label>
              <Form.Control type="number" value={newOrder.totalPrice} onChange={(e) => setNewOrder({ ...newOrder, totalPrice: e.target.value })} required />
            </Form.Group>
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Control as="select" value={newOrder.status} onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}>
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
