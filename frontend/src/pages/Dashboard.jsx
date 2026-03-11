import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("published");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem("products") || "[]");
    setProducts(storedProducts);
  }, []);

  const publishedProducts = products.filter(
    (p) => p.status === "published"
  );
  const unpublishedProducts = products.filter(
    (p) => p.status === "draft"
  );

  const handleToggleStatus = (productId) => {
    setProducts((prev) => {
      const updated = prev.map((p) =>
        p.id === productId
          ? { ...p, status: p.status === "published" ? "draft" : "published" }
          : p
      );
      localStorage.setItem("products", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <Layout>
      {/* Tabs */}
      <div className="border-b mb-6">
        <button
          onClick={() => setActiveTab("published")}
          className={`px-5 py-2 text-sm font-medium ${
            activeTab === "published"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-black"
          }`}
        >
          Published
        </button>

        <button
          onClick={() => setActiveTab("unpublished")}
          className={`px-5 py-2 text-sm font-medium ml-4 ${
            activeTab === "unpublished"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-black"
          }`}
        >
          Unpublished
        </button>
      </div>

      {activeTab === "published" && (
        publishedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
            <div className="text-5xl mb-3">🟦➕</div>
            <h2 className="text-xl font-semibold">No Published Products</h2>
            <p className="text-sm mt-1">Your published products will appear here.</p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">Published Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPublishToggle={() => handleToggleStatus(product.id)}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>
          </div>
        )
      )}

      {activeTab === "unpublished" && (
        unpublishedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-gray-600">
            <div className="text-5xl mb-3">📦</div>
            <h2 className="text-xl font-semibold">No Unpublished Products</h2>
            <p className="text-sm mt-1">
              Products saved as drafts will appear here.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">Unpublished Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {unpublishedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPublishToggle={() => handleToggleStatus(product.id)}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
            </div>
          </div>
        )
      )}
    </Layout>
  );
};

export default Dashboard;