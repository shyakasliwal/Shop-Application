import React, { useState } from "react";

const ProductCard = ({
  product,
  onPublishToggle,
  onEdit,
  onDelete,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const images =
    product.images && product.images.length
      ? product.images
      : product.image
      ? [product.image]
      : [];
  const totalImages = images.length;
  const isPublished = product.status === "published";
  const activeImage = images[activeIndex] || "";

  const handleDotClick = (index) => {
    setActiveIndex(index);
  };

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {activeImage ? (
        <img
          src={activeImage}
          alt={product.name}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="h-40 w-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          No image
        </div>
      )}

      {totalImages > 1 && (
        <div className="flex items-center justify-center gap-1 py-1 bg-white/80">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleDotClick(index)}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                index === activeIndex
                  ? "bg-blue-600"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Show image ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div className="flex-1 px-4 py-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500">
              {product.brand || "Unknown brand"}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
              isPublished
                ? "bg-green-50 text-green-700"
                : "bg-gray-50 text-gray-500"
            }`}
          >
            {isPublished ? "Published" : "Draft"}
          </span>
        </div>

        <p className="text-xs text-gray-500">
          Type:{" "}
          <span className="font-medium text-gray-700">
            {product.type}
          </span>
        </p>
        <p className="text-xs text-gray-500">
          Stock:{" "}
          <span className="font-medium text-gray-700">
            {product.stock}
          </span>
        </p>
        <p className="text-xs text-gray-500">
          MRP:{" "}
          <span className="font-medium text-gray-700">
            ₹{product.mrp}
          </span>
        </p>
        <p className="text-xs text-gray-500">
          Selling:{" "}
          <span className="font-semibold text-green-700">
            ₹{product.sellingPrice}
          </span>
        </p>
        <p className="text-xs text-gray-500">
          Total Images:{" "}
          <span className="font-medium text-gray-700">
            {totalImages}
          </span>
        </p>
        <p className="text-xs text-gray-500">
          Exchange Eligible:{" "}
          <span className="font-medium text-gray-700">
            {product.exchangeEligible ? "YES" : "NO"}
          </span>
        </p>
      </div>

      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
        {onPublishToggle && (
          <button
            type="button"
            onClick={() => onPublishToggle(product)}
            className={`flex-1 inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-xs font-semibold ${
              isPublished
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isPublished ? "Unpublish" : "Publish"}
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
            onClick={() => onEdit(product)}
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(product)}
            className="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;

