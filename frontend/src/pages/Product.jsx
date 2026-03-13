import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const initialFormState = {
  name: "",
  type: "",
  stock: "",
  mrp: "",
  sellingPrice: "",
  brand: "",
  description: "",
  returnEligible: "no",
};

const mapApiProductToUi = (apiProduct) => {
  const imagesArray = Array.isArray(apiProduct.images)
    ? apiProduct.images
    : apiProduct.imageUrl
    ? [apiProduct.imageUrl]
    : [];

  const firstImage = imagesArray[0] || "";
  const status =
    apiProduct.status ||
    (apiProduct.isPublished ? "published" : "draft");

  return {
    id: apiProduct._id,
    name: apiProduct.name,
    brand: apiProduct.brand,
    type: apiProduct.type,
    stock: apiProduct.stock,
    mrp: apiProduct.mrp,
    sellingPrice: apiProduct.sellingPrice,
    image: firstImage,
    images: imagesArray,
    exchangeEligible: Boolean(apiProduct.returnEligible),
    status,
    description: apiProduct.description || "",
  };
};

const Product = () => {
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/api/products`);
      if (!res.ok) {
        throw new Error("Failed to load products");
      }
      const data = await res.json();
      const mapped = data.map(mapApiProductToUi);
      setProducts(mapped);
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem("products") || "[]");
    if (storedProducts.length) {
      setProducts(storedProducts);
    }
    void fetchProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelected = async (file) => {
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setImageError(
        "Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET."
      );
      return;
    }

    setImageError("");
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to upload image");
      }

      if (!data.secure_url) {
        throw new Error("Image URL missing from Cloudinary response");
      }

      setImageUrls((prev) => [...prev, data.secure_url]);
    } catch (err) {
      setImageError(err.message || "Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      void handleImageSelected(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;
    for (const file of files) {
      void handleImageSelected(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const primaryImageUrl = imageUrls[0] || "";

      const payload = {
        name: form.name.trim(),
        type: form.type.trim(),
        stock: Number(form.stock) || 0,
        mrp: Number(form.mrp) || 0,
        sellingPrice: Number(form.sellingPrice) || 0,
        brand: form.brand.trim(),
        description: form.description.trim(),
        returnEligible: form.returnEligible === "yes",
        imageUrl: primaryImageUrl,
        images: imageUrls,
      };

      const isEditing = Boolean(editingProduct);
      const url = isEditing
        ? `${API_BASE}/api/products/${editingProduct.id}`
        : `${API_BASE}/api/products`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ||
            (isEditing
              ? "Failed to update product"
              : "Failed to create product")
        );
      }

      const apiProduct = await res.json();
      const mapped = mapApiProductToUi(apiProduct);

      if (isEditing) {
        setProducts((prev) =>
          prev.map((p) => (p.id === mapped.id ? mapped : p))
        );
      } else {
        setProducts((prev) => [mapped, ...prev]);
      }

      setShowForm(false);
      setEditingProduct(null);
      setForm(initialFormState);
      setImageUrls([]);
      setImageError("");
    } catch (err) {
      setError(
        err.message ||
          (editingProduct
            ? "Failed to update product"
            : "Failed to create product")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    setEditingProduct(null);
    setForm(initialFormState);
    setImageUrls([]);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || "",
      type: product.type || "",
      stock: String(product.stock ?? ""),
      mrp: String(product.mrp ?? ""),
      sellingPrice: String(product.sellingPrice ?? ""),
      brand: product.brand || "",
      description: product.description || "",
      returnEligible: product.exchangeEligible ? "yes" : "no",
    });
    setImageUrls(
      product.images && product.images.length
        ? product.images
        : product.image
        ? [product.image]
        : []
    );
    setShowForm(true);
  };

  const handleCloseModal = () => {
    if (submitting || imageUploading) return;
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleTogglePublish = async (product) => {
    try {
      const isCurrentlyPublished = product.status === "published";
      const res = await fetch(`${API_BASE}/api/products/${product.id}/publish`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublished: !isCurrentlyPublished }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update publish status");
      }

      const apiProduct = await res.json();
      const mapped = mapApiProductToUi(apiProduct);

      setProducts((prev) =>
        prev.map((p) => (p.id === mapped.id ? mapped : p))
      );
    } catch (err) {
      setError(err.message || "Failed to update publish status");
    }
  };

  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm("Are you sure you want to delete this product?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/products/${product.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete product");
      }

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      setError(err.message || "Failed to delete product");
    }
  };

  const publishedProducts = products.filter(
    (p) => p.status === "published"
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">Products</h1>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          Add your Products
        </button>
      </div>
      <div className="w-full border-b-2 border-blue-500 mt-2"></div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-gray-500">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-600">
          <div className="text-7xl mb-3">🟦 ➕</div>
          <h2 className="text-xl font-semibold">Feels a little empty over here...</h2>
          <p className="text-sm mt-1 text-center">
            You can create products without connecting store.
            <br />
            You can add products to store anytime.
          </p>
          <button
            onClick={handleOpenModal}
            className="mt-6 px-6 py-2 text-white font-medium rounded bg-blue-600 hover:bg-blue-700 transition"
          >
            Add your Products
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Products</h2>
            <span className="text-sm text-gray-500">{products.length} items</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPublishToggle={handleTogglePublish}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
           
         
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingProduct ? "Edit product" : "Create new product"}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Running Shoes"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Type
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Stock
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleInputChange}
                    min={0}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. 50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MRP
                  </label>
                  <input
                    type="number"
                    name="mrp"
                    value={form.mrp}
                    onChange={handleInputChange}
                    min={0}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. 1999"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price
                  </label>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={form.sellingPrice}
                    onChange={handleInputChange}
                    min={0}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. 1499"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={form.brand}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Nike"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exchange or return eligibility
                  </label>
                  <select
                    name="returnEligible"
                    value={form.returnEligible}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a short description for this product..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Product Images
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="mt-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center"
                >
                  <p className="text-sm text-gray-700 font-medium">
                    Drag & drop image here, or
                  </p>
              <label className="mt-2 inline-flex items-center justify-center rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-blue-200 cursor-pointer hover:bg-blue-50">
                    Browse files
                    <input
                      type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG up to ~5MB
                  </p>

                  {imageUploading && (
                    <p className="mt-2 text-xs text-blue-600">
                      Uploading image...
                    </p>
                  )}

                  {imageError && (
                    <p className="mt-2 text-xs text-red-600">
                      {imageError}
                    </p>
                  )}

                  {imageUrls.length > 0 && !imageUploading && (
                    <div className="mt-3 flex flex-wrap gap-2 justify-center">
                      {imageUrls.map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt="Preview"
                          className="h-14 w-14 rounded-lg object-cover border border-gray-200"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  disabled={submitting || imageUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || imageUploading}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? editingProduct
                      ? "Saving..."
                      : "Creating..."
                    : editingProduct
                    ? "Save changes"
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Product;