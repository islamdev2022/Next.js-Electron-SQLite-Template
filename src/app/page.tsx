"use client";
import { useEffect, useState } from "react";
import ImageUpload from "../components/ImageUpload";
import Image from "next/image";
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  image_path?: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
  });
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [resetTrigger, setResetTrigget] = useState<number>(0)
  const [productImages, setProductImages] = useState<{ [key: number]: string }>(
    {}
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI) {
      loadProducts();
    }
  }, []);

  const loadProducts = async () => {
    if (typeof window !== "undefined" && window.electronAPI) {
      const productsData = await window.electronAPI.getProducts();
      setProducts(productsData);
      console.log("Products loaded:", productsData);

      // Load images for products that have image_path
      const imagePromises = productsData
        .filter((product) => product.image_path)
        .map(async (product) => {
          try {
            const imageData = await window.electronAPI.getImage(
              product.image_path!
            );
            if (imageData && imageData.exists) {
              return { id: product.id, data: imageData.data };
            }
          } catch (error) {
            console.error("Error loading image for product", product.id, error);
          }
          return null;
        });

      const images = await Promise.all(imagePromises);
      const imageMap: { [key: number]: string } = {};
      images.forEach((img) => {
        if (img) {
          imageMap[img.id] = img.data;
        }
      });
      setProductImages(imageMap);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUploaded = (imagePath: string) => {
    console.log("handleImageUploaded called with path:", imagePath);
    setSelectedImage(imagePath);
  };

  const addNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.stock) {
      alert("Please fill in all fields");
      return;
    }

    if (typeof window !== "undefined" && window.electronAPI) {
      try {
        console.log("Adding product with selectedImage:", selectedImage);
        console.log("Adding product with image_path:", selectedImage);
        await window.electronAPI.addProduct({
          name: formData.name,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          image_path: selectedImage || null,
        });

        // Clear form
        setFormData({
          name: "",
          price: "",
          stock: "",
          
        });
        setSelectedImage("");
        setResetTrigget(prev => prev + 1)
        // Refresh products list
        await loadProducts();
      } catch (error) {
        console.error("Error adding product:", error);
        alert("Error adding product. Please try again.");
      }
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    if (typeof window !== "undefined" && window.electronAPI) {
      try {
        await window.electronAPI.deleteProduct(id);
        // Refresh products list
        await loadProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Error deleting product. Please try again.");
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Store Inventory</h1>
      </div>

      {/* Add Product Form */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Add New Product
        </h2>
        <form onSubmit={addNewProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Product Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Wooden Door"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                required
              />
            </div>
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Price (DZD)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="e.g. 15000"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                required
              />
            </div>
            <div>
              <label
                htmlFor="stock"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Stock Quantity
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="e.g. 5"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                required
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="border-t pt-4">
            <ImageUpload
              onImageUploaded={handleImageUploaded}
              currentImage={selectedImage}
              resetTrigger={resetTrigger}
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors"
          >
            Add Product
          </button>
        </form>
      </div>

      {/* Products List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Products ({products.length})
        </h2>
        {products.length === 0 ? (
          <p className="text-gray-500 italic">
            No products found. Add some products to get started!
          </p>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  {/* Product Image */}
                  {productImages[product.id] && (
                    <div className="flex-shrink-0">
                      <Image
                        src={productImages[product.id]}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg border"
                        width={64}
                        height={64}
                      />
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex gap-4 text-sm text-gray-600">
                      <span className="font-medium">
                        Price: {product.price.toLocaleString()} DZD
                      </span>
                      <span className="font-medium">
                        Stock: {product.stock} units
                      </span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors flex-shrink-0"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
