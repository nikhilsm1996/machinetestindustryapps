import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const Home = () => {
  return (
    <>
      <Navbar />
      <div className="container text-center mt-5">
        <h1>Welcome to Order Management</h1>
        <p>Manage your orders efficiently and easily.</p>
      </div>
      <Footer />
    </>
  );
};

export default Home;
