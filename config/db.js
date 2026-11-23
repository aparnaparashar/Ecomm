const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const bcrypt = require("bcryptjs");

let mongodInstance = null;

async function seedDataIfEmpty() {
  const User = require("../models/user");
  const Product = require("../models/product");
  const Category = require("../models/category");
  const Order = require("../models/order");

  const catCount = await Category.countDocuments();
  if (catCount > 0) return; // already populated

  console.log("⚡ Auto-seeding comprehensive Meridian runway collections & designer atelier...");

  // 1. Categories
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

  // 3. 26 High-Fashion Products Designed by International Guest Couturiers
  const products = [
    // === MEN'S ATELIER ===
    {
      productCode: "MRD-MEN-01",
      title: "Meridian Midnight Wool Blazer",
      description: "Hand-finished Italian virgin wool blazer with peak satin lapels and antique brass meridian buttons. Cut in a modern structured drop-7 silhouette.",
      price: 8499,
      category: menCat._id,
      imagePath: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800",
      manufacturer: "Meridian Sartorial",
      designer: "Alessandro Rossi",
      designerOrigin: "Milan, Italy",
      fabric: "100% Biella Virgin Wool (Super 150s)",
      available: true,
      featured: true
    },
    {
      productCode: "MRD-MEN-02",
      title: "Artisanal Poplin Oxford Shirt",
      description: "Crisp Egyptian long-staple cotton poplin shirt with mother-of-pearl buttons. Tailored with French seams and spread collar for effortless drape.",
      price: 3299,
      category: menCat._id,
      imagePath: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800",
      manufacturer: "Meridian Essentials",
      designer: "Alessandro Rossi",
      designerOrigin: "Milan, Italy",
      fabric: "100% Giza 87 Egyptian Cotton",
      available: true,
      featured: false
    },
    {
      productCode: "MRD-MEN-03",
      title: "Tuscan Calfskin Moto Jacket",
      description: "Supple, vegetable-tanned grain calfskin jacket with antique gold Swiss RiRi hardware and hand-quilted silk twill lining.",
      price: 14999,
      category: menCat._id,
      imagePath: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
      manufacturer: "Meridian Atelier",
      designer: "Alessandro Rossi",
      designerOrigin: "Milan, Italy",
      fabric: "Full-Grain Tuscan Calfskin & Mulberry Silk",
      available: true,
      featured: true
    },
    {
      productCode: "MRD-MEN-04",
      title: "Pleated Tapered Cashmere Trousers",
      description: "Double-pleated tailored trousers woven from soft cashmere-wool blend in charcoal melange. Features side tab adjusters and a 4cm cuff.",
      price: 4599,
      category: menCat._id,
      imagePath: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800",
      manufacturer: "Meridian Sartorial",
      designer: "Alessandro Rossi",
      designerOrigin: "Milan, Italy",
      fabric: "70% Wool, 30% Mongolian Cashmere",
      available: true,
      featured: false
    },
    {
      productCode: "MRD-MEN-05",
      title: "Sovereign Double-Breasted Cashmere Coat",
      description: "Opulent knee-length greatcoat crafted from double-faced camel cashmere. Features horn buttons and deep turn-up pockets.",
      price: 18499,
      category: menCat._id,
      imagePath: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800",
      manufacturer: "Meridian Bespoke",
      designer: "Alessandro Rossi",
      designerOrigin: "Milan, Italy",
      fabric: "100% Grade-A Mongolian Cashmere",
      available: true,
      featured: true
    },
    {
      productCode: "MRD-MEN-06",
      title: "Imperial Black-Tie Tuxedo Ensemble",
      description: "Barathea wool evening tuxedo with grosgrain silk peak lapels and covered buttons. The gold standard for formal galas.",
      price: 16999,
      category: menCat._id,
      imagePath: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800",
      manufacturer: "Meridian Bespoke",
      designer: "Alessandro Rossi",
      designerOrigin: "Milan, Italy",
      fabric: "British Barathea Wool & Mulberry Grosgrain Silk",
      available: true,
      featured: false
    },
    {
      productCode: "MRD-MEN-07",
      title: "Merino Fine-Gauge Knit Crewneck",
      description: "Spun in Scotland from ultra-fine 18-micron merino yarn. Exceptionally breathable and soft against the skin.",
      price: 3899,
      category: menCat._id,
      imagePath: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800",
      manufacturer: "Meridian Essentials",
      designer: "Claire Laurent",
      designerOrigin: "Lyon, France",
      fabric: "100% Extra-Fine Australian Merino Wool",
      available: true,
      featured: false
    },

    // === WOMEN'S HAUTE COUTURE ===
    {
      productCode: "MRD-WMN-01",
      title: "Aura Champagne Silk Slip Gown",
      description: "Pure mulberry silk bias-cut gown that drapes like liquid light. Features delicate cowl neckline, French seams, and crisscross open back.",
      price: 9999,
      category: womenCat._id,
      imagePath: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
      manufacturer: "Meridian Haute",
      designer: "Elena Rostova",
      designerOrigin: "Paris, France",
      fabric: "100% 22-Momme Mulberry Charmeuse Silk",
      available: true,
      featured: true
    },
    {
      productCode: "MRD-WMN-02",
      title: "Mongolian Ribbed Cashmere Knit",
      description: "Featherlight pure cashmere turtleneck sweater crafted in ribbed fisherman stitch. The definition of architectural quiet luxury.",
      price: 6499,
      category: womenCat._id,
      imagePath: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800",
      manufacturer: "Meridian Luxe",
      designer: "Claire Laurent",
      designerOrigin: "Lyon, France",
      fabric: "100% Organic Mongolian Cashmere",
      available: true,
      featured: false
    },
    {
      productCode: "MRD-WMN-03",
      title: "Zardozi Embroidered Raw Silk Kurti",
      description: "Handcrafted raw silk tunic with delicate golden Zardozi metal threadwork along the keyhole neckline and scalloped cuffs. Imperial royalty meets modern lines.",
      price: 5299,
      category: womenCat._id,
      imagePath: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800",
      manufacturer: "Meridian Heritage",
      designer: "Aarav Mehra",
      designerOrigin: "New Delhi, India",
      fabric: "100% Handloom Matka Raw Silk & Gilded Zari",
      available: true,
      featured: true
    },
    {
      productCode: "MRD-WMN-04",
      title: "Sovereign High-Waist Wool Trousers",
      description: "Sculpted wide-leg trousers in ivory brushed flannel wool. Impeccable drape with hidden waistband construction and sharp center creases.",
      price: 4299,
      category: womenCat._id,
      imagePath: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
      manufacturer: "Meridian Sartorial",
      designer: "Elena Rostova",
      designerOrigin: "Paris, France",
      fabric: "100% Virgin Flannel Wool",
      available: true,
      featured: false
    },
    {
      productCode: "MRD-WMN-05",
      title: "Elysian Velvet Opera Cape",
      description: "Sweeping floor-length cape fashioned from silk velvet in imperial emerald green, fastened with a bespoke brass meridian clasp.",
      price: 13499,
      category: womenCat._id,
      imagePath: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800",
      manufacturer: "Meridian Haute",
      designer: "Elena Rostova",
      designerOrigin: "Paris, France",
      fabric: "80% Silk Velvet, 20% Cupro Silk Lining",
      available: true,
      featured: true
    },
    {
      productCode: "MRD-WMN-06",
      title: "Hand-Woven Banarasi Organza Ensemble",
      description: "Translucent gold-threaded tissue organza drape with hand-woven Kadwa floral motifs in metallic champagne and blush pink.",
      price: 11999,
      category: womenCat._id,
      imagePath: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
      manufacturer: "Meridian Heritage",
      designer: "Aarav Mehra",
      designerOrigin: "New Delhi, India",
      fabric: "Pure Katan Silk & Real Silver-Gilded Zari",
      available: true,
      featured: false
    },
    {
      productCode: "MRD-WMN-07",
      title: "Sculpted Crepe Runway Jacket",
      description: "Cinched-waist architectural jacket in heavy Japanese crepe with horn buttons and padded sculpted shoulders.",
      price: 7899,
      category: womenCat._id,
      imagePath: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800",
      manufacturer: "Meridian Atelier",
      designer: "Kenji Takahashi",
      designerOrigin: "Tokyo, Japan",
      fabric: "Triacetate Heavy Crepe",
      available: true,
      featured: false
    },
    {
      productCode: "MRD-WMN-08",
      title: "Plissé Accordion Pleated Midi Dress",
      description: "Permanent heat-pleated midi dress in sunset amber that moves gracefully with every step. Unlined for breathable, weightless elegance.",
      price: 6899,
      category: womenCat._id,
      imagePath: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800",
      manufacturer: "Meridian Atelier",
      designer: "Elena Rostova",
      designerOrigin: "Paris, France",
      fabric: "Micro-Pleated Silk Chiffon Blend",
      available: false, // Out of stock showcase
      featured: false
    },

    // === KIDS' BESPOKE COLLECTION ===
    {
      productCode: "MRD-KID-01",
      title: "Petite Celestial Velvet Dress",
      description: "Soft midnight blue velvet frock embroidered with celestial constellation stars. Breathable organic cotton lining for delicate skin.",
      price: 2899,
      category: kidsCat._id,
      imagePath: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800",
      manufacturer: "Meridian Enfants",
      designer: "Claire Laurent",
      designerOrigin: "Lyon, France",
      fabric: "Organic Cotton Velvet & Gold Thread",
      available: true,
      featured: true
    },
    {
      productCode: "MRD-KID-02",
      title: "Organic Breton Stripe Cotton Tee",
      description: "GOTS-certified organic Peruvian Pima cotton Breton striped long-sleeve tee. Soft, breathable, hypoallergenic, and timeless.",
      price: 1499,
      category: kidsCat._id,
      imagePath: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800",
      manufacturer: "Meridian Enfants",
      designer: "Claire Laurent",
      designerOrigin: "Lyon, France",
      fabric: "100% GOTS Certified Organic Pima Cotton",
      available: true,
      featured: false
    },
    {
      productCode: "MRD-KID-03",
      title: "Heritage Japanese Denim Dungarees",
      description: "Vintage-washed lightweight denim overalls with adjustable solid brass closures and reinforced play knees.",
      price: 2399,
      category: kidsCat._id,
      imagePath: "https://images.unsplash.com/photo-1543854589-fdd4d3a0d181?w=800",
      manufacturer: "Meridian Enfants",
      designer: "Kenji Takahashi",
      designerOrigin: "Tokyo, Japan",
      fabric: "10-Ounce Okayama Organic Denim",
      available: true,
      featured: false
    },
    {
      productCode: "MRD-KID-04",
      title: "Sherpa Fleece Explorer Hooded Set",
      description: "Cloud-soft brushed fleece jacket and jogger matching set in warm camel hue. Keeps young adventurers warm and comfortable.",
      price: 2799,
      category: kidsCat._id,
      imagePath: "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=800",
      manufacturer: "Meridian Enfants",
      designer: "Claire Laurent",
      designerOrigin: "Lyon, France",
      fabric: "Recycled Eco-Sherpa Fleece & Organic Cotton Rib",
      available: true,
      featured: false
    },
    {
      productCode: "MRD-KID-05",
      title: "Miniature Cashmere Cable Cardigan",
      description: "Heirloom cable-knit buttoned cardigan knitted from soft grade-A cashmere with genuine mother-of-pearl buttons.",
      price: 3499,
      category: kidsCat._id,
      imagePath: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800",
      manufacturer: "Meridian Enfants",
      designer: "Claire Laurent",
      designerOrigin: "Lyon, France",
      fabric: "100% Scottish Spun Baby Cashmere",
      available: true,
      featured: false
    },
    {
      productCode: "MRD-KID-06",
      title: "Riviera Pure Linen Summer Romper",
      description: "Washed French linen romper with coconut wood buttons. Lightweight, breezy, and effortlessly elegant for sunny garden afternoons.",
      price: 1999,
      category: kidsCat._id,
      imagePath: "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800",
      manufacturer: "Meridian Enfants",
      designer: "Alessandro Rossi",
      designerOrigin: "Milan, Italy",
      fabric: "100% Normandy Washed Linen",
      available: true,
      featured: false
    },

    // === HAUTE ACCESSORIES & LEATHER GOODS ===
    {
      productCode: "MRD-ACC-01",
      title: "The Meridian Signet Compass Ring",
      description: "Solid 18k yellow gold vermeil over sterling silver signet ring, deeply engraved with the iconic Meridian geometric diamond compass.",
      price: 4999,
      category: accCat._id,
      imagePath: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800",
      manufacturer: "Meridian Joaillerie",
      designer: "Alessandro Rossi",
      designerOrigin: "Milan, Italy",
      fabric: "18k Gold Vermeil (5 Micron) & 925 Sterling Silver",
      available: true,
      featured: true
    },
    {
      productCode: "MRD-ACC-02",
      title: "Florentine Full-Grain Leather Briefcase",
      description: "Mastercrafted in Florence using vegetable-tanned bridle leather. Hand-burnished edges, solid brass push-lock, and laptop compartment.",
      price: 12999,
      category: accCat._id,
      imagePath: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800",
      manufacturer: "Meridian Maroquinerie",
      designer: "Alessandro Rossi",
      designerOrigin: "Milan, Italy",
      fabric: "Hand-Stained Florentine Bridle Leather",
      available: true,
      featured: true
    },
    {
      productCode: "MRD-ACC-03",
      title: "Meridian Constellation Silk Twill Scarf",
      description: "90cm x 90cm square scarf depicting hand-illustrated astronomical navigation charts. Features hand-rolled and hand-sewn hem.",
      price: 3599,
      category: accCat._id,
      imagePath: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800",
      manufacturer: "Meridian Atelier",
      designer: "Elena Rostova",
      designerOrigin: "Paris, France",
      fabric: "100% Silk Twill (18 Momme)",
      available: true,
      featured: false
    },
    {
      productCode: "MRD-ACC-04",
      title: "Hand-Stitched Goodyear Suede Chelsea Boots",
      description: "Classic Chelsea boots constructed with Goodyear welted leather soles and water-repellent Italian reverse suede in snuff brown.",
      price: 8999,
      category: accCat._id,
      imagePath: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800",
      manufacturer: "Meridian Bottier",
      designer: "Alessandro Rossi",
      designerOrigin: "Milan, Italy",
      fabric: "Italian Calf Suede & Oak-Bark Tanned Leather Sole",
      available: true,
      featured: false
    }
  ];

  const createdProducts = await Product.insertMany(products);
  console.log(`✓ ${createdProducts.length} Couture Creations catalogued across Men, Women, Kids & Accessories.`);

  // 4. Real Orders with Real Historical Financial Ledger
  const orders = [
    {
      user: client1._id,
      cart: {
        totalQty: 2,
        totalCost: 11798,
        items: [
          {
            productId: createdProducts[0]._id,
            qty: 1,
            price: 8499,
            title: createdProducts[0].title,
            productCode: createdProducts[0].productCode
          },
          {
            productId: createdProducts[1]._id,
            qty: 1,
            price: 3299,
            title: createdProducts[1].title,
            productCode: createdProducts[1].productCode
          }
        ]
      },
      address: "Aparna Sharma, 42 Civil Lines, North Delhi - 110054",
      paymentId: "pay_rzp_live_839210",
      paymentMethod: "Razorpay (UPI / Card)",
      delivered: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      user: client2._id,
      cart: {
        totalQty: 2,
        totalCost: 27998,
        items: [
          {
            productId: createdProducts[2]._id,
            qty: 1,
            price: 14999,
            title: createdProducts[2].title,
            productCode: createdProducts[2].productCode
          },
          {
            productId: createdProducts[23]._id,
            qty: 1,
            price: 12999,
            title: createdProducts[23].title,
            productCode: createdProducts[23].productCode
          }
        ]
      },
      address: "Vikram Singhania, Penthouse 18, Golf Links, New Delhi - 110003",
      paymentId: "pay_rzp_live_948271",
      paymentMethod: "Razorpay (Credit Card)",
      delivered: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      user: client3._id,
      cart: {
        totalQty: 3,
        totalCost: 28497,
        items: [
          {
            productId: createdProducts[7]._id,
            qty: 1,
            price: 9999,
            title: createdProducts[7].title,
            productCode: createdProducts[7].productCode
          },
          {
            productId: createdProducts[11]._id,
            qty: 1,
            price: 13499,
            title: createdProducts[11].title,
            productCode: createdProducts[11].productCode
          },
          {
            productId: createdProducts[22]._id,
            qty: 1,
            price: 4999,
            title: createdProducts[22].title,
            productCode: createdProducts[22].productCode
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
        totalCost: 5299,
        items: [
          {
            productId: createdProducts[9]._id,
            qty: 1,
            price: 5299,
            title: createdProducts[9].title,
            productCode: createdProducts[9].productCode
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
  console.log("✓ Full Haute Couture Database Seeded Successfully!");
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
