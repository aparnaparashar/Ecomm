const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");
const path = require("path");

let mongodInstance = null;

async function seedDataIfEmpty() {
  const User = require("../models/user");
  const Product = require("../models/product");
  const Category = require("../models/category");
  const Order = require("../models/order");
  const Coupon = require("../models/coupon");
  const SupportTicket = require("../models/supportTicket");

  const prodCount = await Product.countDocuments();
  if (prodCount >= 300) {
    console.log(`✓ Database already fully populated with ${prodCount} haute couture products.`);
    return;
  }

  console.log(`⚡ Seeding high-fashion database to reach 300+ real products (current count: ${prodCount})...`);

  // Reset collections to ensure pristine, clean data state
  await Product.deleteMany({});
  await Category.deleteMany({});
  await Order.deleteMany({});
  await User.deleteMany({});
  await Coupon.deleteMany({});
  await SupportTicket.deleteMany({});

  // 1. Categories with distinct, verified imagery
  const categories = await Category.insertMany([
    {
      title: "Men",
      slug: "men",
      description: "Bespoke tailoring, structured outerwear, and sharp silhouettes by master European tailors.",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800"
    },
    {
      title: "Women",
      slug: "women",
      description: "Haute couture eveningwear, hand-embroidered tunics, and fluid bias-cut pure silks.",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800"
    },
    {
      title: "Kids",
      slug: "kids",
      description: "Whimsical luxury, gentle organic Peruvian cottons, and fine velvet for young tastemakers.",
      image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800"
    },
    {
      title: "Accessories",
      slug: "accessories",
      description: "Handcrafted Tuscan leather goods, pure silk twill squares, and bespoke 18k signet pieces.",
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800"
    }
  ]);

  const [menCat, womenCat, kidsCat, accCat] = categories;
  const catMap = {
    men: menCat._id,
    women: womenCat._id,
    kids: kidsCat._id,
    accessories: accCat._id
  };

  // 2. Users (Admin + Multiple Verified Clients)
  const adminPassword = bcrypt.hashSync("admin123", bcrypt.genSaltSync(10));
  const adminUser = await User.create({
    username: "Meridian Curator",
    email: "admin@meridian.style",
    password: adminPassword,
    isAdmin: true
  });

  const userPassword = bcrypt.hashSync("user123", bcrypt.genSaltSync(10));
  const client1 = await User.create({
    username: "Aparna Sharma",
    email: "aparna@test.com",
    password: userPassword,
    isAdmin: false
  });

  const client2 = await User.create({
    username: "Vikram Singhania",
    email: "vikram@singhania.co",
    password: userPassword,
    isAdmin: false
  });

  const client3 = await User.create({
    username: "Zara Montgomery",
    email: "zara.m@montgomery.luxury",
    password: userPassword,
    isAdmin: false
  });

  // 3. Load Pristine 381 Items with 100% Exact Image-to-Title Alignment
  const pristineCatalog = require("./seed_products_pristine.json");
  const productsToInsert = pristineCatalog.map((item) => ({
    productCode: item.productCode,
    title: item.title,
    description: item.description,
    price: item.price,
    category: catMap[item.categoryKey],
    imagePath: item.imagePath,
    manufacturer: item.manufacturer,
    designer: item.designer,
    designerOrigin: item.designerOrigin,
    fabric: item.fabric,
    available: item.available !== false,
    featured: !!item.featured
  }));

  const createdProducts = await Product.insertMany(productsToInsert);
  console.log(`✓ Seeded ${createdProducts.length} high-fashion products into MongoDB!`);

  // 4. Seed Realistic Order Ledgers for Live Business Analytics
  const orders = [
    {
      user: client1._id,
      cart: {
        totalQty: 2,
        totalCost: 27998,
        items: [
          {
            productId: createdProducts[0]._id,
            qty: 1,
            price: createdProducts[0].price,
            title: createdProducts[0].title,
            productCode: createdProducts[0].productCode
          },
          {
            productId: createdProducts[290]._id,
            qty: 1,
            price: createdProducts[290].price,
            title: createdProducts[290].title,
            productCode: createdProducts[290].productCode
          }
        ]
      },
      address: "Aparna Sharma, 42 Civil Lines, North Delhi - 110054",
      paymentId: "pay_rzp_live_948201",
      paymentMethod: "Razorpay (Cards)",
      delivered: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      user: client2._id,
      cart: {
        totalQty: 1,
        totalCost: createdProducts[3] ? createdProducts[3].price : 14999,
        items: [
          {
            productId: createdProducts[3]._id,
            qty: 1,
            price: createdProducts[3].price,
            title: createdProducts[3].title,
            productCode: createdProducts[3].productCode
          }
        ]
      },
      address: "Vikram Singhania, Penthouse 18B, Worli Sea Face, Mumbai - 400018",
      paymentId: "pay_rzp_live_104928",
      paymentMethod: "Razorpay (UPI - GooglePay)",
      delivered: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      user: client3._id,
      cart: {
        totalQty: 3,
        totalCost: createdProducts[150].price + createdProducts[160].price + createdProducts[300].price,
        items: [
          {
            productId: createdProducts[150]._id,
            qty: 1,
            price: createdProducts[150].price,
            title: createdProducts[150].title,
            productCode: createdProducts[150].productCode
          },
          {
            productId: createdProducts[160]._id,
            qty: 1,
            price: createdProducts[160].price,
            title: createdProducts[160].title,
            productCode: createdProducts[160].productCode
          },
          {
            productId: createdProducts[300]._id,
            qty: 1,
            price: createdProducts[300].price,
            title: createdProducts[300].title,
            productCode: createdProducts[300].productCode
          }
        ]
      },
      address: "Zara Montgomery, Villa 4, Amrita Shergill Marg, New Delhi - 110003",
      paymentId: "pay_rzp_live_382910",
      paymentMethod: "Razorpay (NetBanking)",
      delivered: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      user: client1._id,
      cart: {
        totalQty: 1,
        totalCost: createdProducts[40].price,
        items: [
          {
            productId: createdProducts[40]._id,
            qty: 1,
            price: createdProducts[40].price,
            title: createdProducts[40].title,
            productCode: createdProducts[40].productCode
          }
        ]
      },
      address: "Aparna Sharma, 42 Civil Lines, North Delhi - 110054",
      paymentId: "pay_rzp_live_571932",
      paymentMethod: "Razorpay (UPI)",
      delivered: false,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  ];

  await Order.insertMany(orders);
  console.log(`✓ ${orders.length} Real-World Acquisition Ledgers established.`);

  // 5. Promotional Coupons & Atelier Privileges
  const demoCoupons = [
    {
      code: "WELCOME15",
      description: "Welcome discount for newly registered atelier clientele",
      discountType: "percent",
      discountValue: 15,
      minPurchase: 3000,
      maxDiscount: 5000,
      isActive: true,
      usageCount: 8
    },
    {
      code: "MERIDIAN500",
      description: "Flat promotional deduction on high-fashion runway orders",
      discountType: "flat",
      discountValue: 500,
      minPurchase: 4999,
      maxDiscount: 500,
      isActive: true,
      usageCount: 14
    },
    {
      code: "VIP20",
      description: "Exclusive VIP bespoke privileges on haute couture creations",
      discountType: "percent",
      discountValue: 20,
      minPurchase: 10000,
      maxDiscount: 15000,
      isActive: true,
      usageCount: 3
    },
    {
      code: "FESTIVE10",
      description: "Seasonal celebratory discount across all apparel collections",
      discountType: "percent",
      discountValue: 10,
      minPurchase: 2000,
      maxDiscount: 3000,
      isActive: true,
      usageCount: 22
    }
  ];
  await Coupon.insertMany(demoCoupons);
  console.log(`✓ ${demoCoupons.length} Active Atelier Coupons initialized.`);

  // 6. Concierge Inquiries & Bespoke Dressmaking Commissions
  const demoTickets = [
    {
      ticketNumber: "COMM-729104",
      type: "bespoke_commission",
      name: "Aparna Sharma",
      email: "aparna@test.com",
      subject: "Bespoke Silk Tuxedo with Zardozi Lapels",
      message: "Requesting a private fitting consultation with Resident Couturier Aarav Mehra for a bespoke silk tuxedo for the Winter Gala in New Delhi.",
      designerName: "Aarav Mehra",
      silhouette: "Architectural Tuxedo",
      status: "In Review",
      priority: "VIP / Haute",
      adminNotes: "Client contacted via phone; fabric swatches and measurement specs dispatched to Civil Lines address.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      ticketNumber: "COMM-610283",
      type: "bespoke_commission",
      name: "Zara Montgomery",
      email: "zara.m@montgomery.luxury",
      subject: "Evening Silk Organza Gown Consultation",
      message: "Seeking bespoke evening gown drapery with Couturier Elena Rostova in Paris. Would like pure mulberry silk in midnight navy.",
      designerName: "Elena Rostova",
      silhouette: "Bias-Cut Evening Gown",
      status: "Pending",
      priority: "VIP / Haute",
      adminNotes: "Initial design brief logged. Awaiting studio sketch submission from Paris atelier.",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      ticketNumber: "SUP-839201",
      type: "support",
      name: "Vikram Singhania",
      email: "vikram@singhania.co",
      subject: "Sizing guidance on Italian Gabardine Suit",
      message: "Inquiring about shoulder drop and chest measurement tolerances for 42R in the Sovereign series.",
      status: "Contacted",
      priority: "Standard",
      adminNotes: "Tailoring team provided precise shoulder point measurements; customer responded positively.",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      ticketNumber: "SUP-502917",
      type: "support",
      name: "Rohan Kapoor",
      email: "rohan@kapoor.in",
      subject: "Express White-Glove Dispatch Inquiry",
      message: "Need confirmation on courier air waybill for order reaching Mumbai before Saturday evening gala.",
      status: "Resolved",
      priority: "Standard",
      adminNotes: "Direct DHL Express tracking ID delivered to client. Marked delivery successful.",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  ];
  await SupportTicket.insertMany(demoTickets);
  console.log(`✓ ${demoTickets.length} Concierge & Support Tickets initialized.`);

  console.log("✓ Full Haute Couture Database Seeded Successfully with 380+ Items!");
}

async function connectDB() {
  const defaultURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/meridian_ecommerce";

  try {
    await mongoose.connect(defaultURI, {
      serverSelectionTimeoutMS: 1500
    });
    console.log("✓ Connected to MongoDB at:", defaultURI);
  } catch (err) {
    console.log("! Local MongoDB service not detected on port 27017.");
    console.log("⚡ Initializing embedded in-memory MongoDB engine...");

    mongodInstance = await MongoMemoryServer.create();
    const memURI = mongodInstance.getUri() + "meridian_ecommerce";
    await mongoose.connect(memURI);
    console.log("✓ Connected to In-Memory MongoDB at:", memURI);
  }

  // Ensure data exists
  await seedDataIfEmpty();
}

module.exports = { connectDB };
