require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/user");
const Product = require("../models/product");
const Category = require("../models/category");
const Cart = require("../models/cart");
const Order = require("../models/order");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/meridian_ecommerce";

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB for seeding...");

    // Clear previous records
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});
    console.log("✓ Purged old collection data.");

    // Create Categories
    const categories = await Category.insertMany([
      {
        title: "Men",
        slug: "men",
        description: "Bespoke tailoring, outerwear, and structured silhouettes for gentlemen.",
        image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800"
      },
      {
        title: "Women",
        slug: "women",
        description: "Haute couture, silk eveningwear, and contemporary artisanal drapes.",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800"
      },
      {
        title: "Kids",
        slug: "kids",
        description: "Whimsical luxury and gentle organic fabrics for young explorers.",
        image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800"
      }
    ]);
    console.log("✓ Categories catalogued (Men, Women, Kids).");

    const [menCat, womenCat, kidsCat] = categories;

    // Create Admin & Demo Customer
    const adminPassword = bcrypt.hashSync("admin123", bcrypt.genSaltSync(10));
    const adminUser = await User.create({
      username: "Meridian Curator",
      email: "admin@meridian.style",
      password: adminPassword,
      isAdmin: true
    });

    const userPassword = bcrypt.hashSync("user123", bcrypt.genSaltSync(10));
    const demoUser = await User.create({
      username: "Aparna Sharma",
      email: "aparna@test.com",
      password: userPassword,
      isAdmin: false
    });
    console.log("✓ Admin and Demo Customer profiles established.");

    // Curated Apparel Products
    const products = [
      // MEN
      {
        productCode: "MRD-MEN-01",
        title: "Meridian Midnight Wool Blazer",
        description: "Hand-stitched Italian virgin wool blazer with peak satin lapels and antique brass meridian buttons. An essential cornerstone for black-tie gatherings.",
        price: 8499,
        category: menCat._id,
        imagePath: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800",
        manufacturer: "Meridian Sartorial",
        available: true,
        featured: true
      },
      {
        productCode: "MRD-MEN-02",
        title: "Artisanal Poplin Oxford Shirt",
        description: "Crisp Egyptian long-staple cotton poplin shirt with mother-of-pearl buttons. Tailored with French seams for effortless drape.",
        price: 3299,
        category: menCat._id,
        imagePath: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
        manufacturer: "Meridian Essentials",
        available: true,
        featured: false
      },
      {
        productCode: "MRD-MEN-03",
        title: "Tuscan Calfskin Moto Jacket",
        description: "Supple, vegetable-tanned grain calfskin jacket with antique gold Swiss hardware and silk twill lining.",
        price: 14999,
        category: menCat._id,
        imagePath: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
        manufacturer: "Meridian Atelier",
        available: true,
        featured: true
      },
      {
        productCode: "MRD-MEN-04",
        title: "Pleated Tapered Cashmere Trousers",
        description: "Double-pleated tailored trousers woven from soft cashmere-wool blend in charcoal melange.",
        price: 4599,
        category: menCat._id,
        imagePath: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800",
        manufacturer: "Meridian Sartorial",
        available: true,
        featured: false
      },

      // WOMEN
      {
        productCode: "MRD-WMN-01",
        title: "Aura Champagne Silk Slip Gown",
        description: "Pure mulberry silk bias-cut gown that drapes like liquid light. Features delicate cowl neckline and crisscross back straps.",
        price: 9999,
        category: womenCat._id,
        imagePath: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
        manufacturer: "Meridian Haute",
        available: true,
        featured: true
      },
      {
        productCode: "MRD-WMN-02",
        title: "Mongolian Ribbed Cashmere Knit",
        description: "Featherlight pure cashmere turtleneck sweater crafted in ribbed fisherman stitch. The definition of quiet luxury.",
        price: 6499,
        category: womenCat._id,
        imagePath: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800",
        manufacturer: "Meridian Luxe",
        available: true,
        featured: false
      },
      {
        productCode: "MRD-WMN-03",
        title: "Zardozi Embroidered Silk Kurti",
        description: "Handcrafted raw silk tunic with delicate golden Zardozi embroidery along the neckline and cuffs. Blends imperial heritage with modern minimalism.",
        price: 5299,
        category: womenCat._id,
        imagePath: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800",
        manufacturer: "Meridian Heritage",
        available: true,
        featured: true
      },
      {
        productCode: "MRD-WMN-04",
        title: "Sovereign High-Waist Wool Trousers",
        description: "Sculpted wide-leg trousers in ivory brushed flannel wool. Impeccable drape with hidden waistband construction.",
        price: 4299,
        category: womenCat._id,
        imagePath: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
        manufacturer: "Meridian Sartorial",
        available: true,
        featured: false
      },

      // KIDS
      {
        productCode: "MRD-KID-01",
        title: "Petite Celestial Velvet Dress",
        description: "Soft midnight blue velvet frock embroidered with celestial constellation stars. Breathable cotton lining for gentle comfort.",
        price: 2899,
        category: kidsCat._id,
        imagePath: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800",
        manufacturer: "Meridian Enfants",
        available: true,
        featured: true
      },
      {
        productCode: "MRD-KID-02",
        title: "Organic Breton Stripe Cotton Tee",
        description: "GOTS-certified organic Peruvian Pima cotton Breton striped long-sleeve tee. Soft, breathable, and durable.",
        price: 1499,
        category: kidsCat._id,
        imagePath: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800",
        manufacturer: "Meridian Enfants",
        available: true,
        featured: false
      },
      {
        productCode: "MRD-KID-03",
        title: "Heritage Japanese Denim Dungarees",
        description: "Vintage-washed lightweight denim overalls with adjustable brass closures and deep toy pockets.",
        price: 2399,
        category: kidsCat._id,
        imagePath: "https://images.unsplash.com/photo-1543854589-fdd4d3a0d181?w=800",
        manufacturer: "Meridian Enfants",
        available: true,
        featured: false
      },
      {
        productCode: "MRD-KID-04",
        title: "Sherpa Fleece Explorer Hooded Set",
        description: "Cloud-soft brushed fleece jacket and jogger matching set in warm camel hue. Keeps little ones cozy and stylish.",
        price: 2799,
        category: kidsCat._id,
        imagePath: "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=800",
        manufacturer: "Meridian Enfants",
        available: true,
        featured: false
      }
    ];

    await Product.insertMany(products);
    console.log("✓ 12 Haute Apparel Creations catalogued.");

    // Sample initial order for Aparna
    await Order.create({
      user: demoUser._id,
      cart: {
        totalQty: 2,
        totalCost: 11798,
        items: [
          {
            productId: products[0]._id,
            qty: 1,
            price: 8499,
            title: products[0].title,
            productCode: products[0].productCode
          },
          {
            productId: products[1]._id,
            qty: 1,
            price: 3299,
            title: products[1].title,
            productCode: products[1].productCode
          }
        ]
      },
      address: "Aparna Sharma, IGDTUW Kashmere Gate, New Delhi - 110006",
      paymentId: "MRD-SAMPLE-INITIAL-01",
      paymentMethod: "Meridian Luxe Card",
      delivered: true
    });
    console.log("✓ Sample order history recorded.");

    console.log("");
    console.log("╔════════════════════════════════════════════════════════════════════╗");
    console.log("║                                                                    ║");
    console.log("║           ✓  M E R I D I A N   S E E D   C O M P L E T E           ║");
    console.log("║                                                                    ║");
    console.log("║   Admin Credentials:                                               ║");
    console.log("║     Email:    admin@meridian.style                                 ║");
    console.log("║     Password: admin123                                             ║");
    console.log("║                                                                    ║");
    console.log("║   Client Demo Credentials:                                         ║");
    console.log("║     Email:    aparna@test.com                                      ║");
    console.log("║     Password: user123                                              ║");
    console.log("║                                                                    ║");
    console.log("╚════════════════════════════════════════════════════════════════════╝");
    console.log("");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
