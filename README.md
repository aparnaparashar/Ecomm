# MERIDIAN ◇ Atelier & Haute Couture E-Commerce Platform

> **Department of Computer Science & Engineering**  
> **Indira Gandhi Delhi Technical University For Women (IGDTUW)**  
> **Course:** E-Commerce (BIT-417) Lab  
> **Tech Stack:** Node.js · Express.js · MongoDB · Mongoose · Passport.js · EJS · CSS3

---

## 🌟 Overview & Brand Identity

**MERIDIAN** is a full-stack luxury fashion and apparel e-commerce web platform engineered strictly in accordance with the **BIT-417 E-Commerce Laboratory Manual** (Experiments 1 through 11).

Drawing inspiration from the architectural elegance and minimalist noir aesthetic of the Meridian brand, this e-commerce platform embodies:
- **Meridian Identity:** The geometric diamond monogram and compass motif symbolize finding one's "True North" in sartorial elegance.
- **Signature Opening Animation:** A captivating SVG diamond path drawing and typographic letter-spacing reveal upon first arrival.
- **Noir & Antique Gold Palette:** Deep black canvas (`#0b0c10`), charcoal card glassmorphism (`#161821`), and warm antique gold accents (`#c9a96e`).
- **Resilient Database Layer:** Includes a dual-mode database engine — connects to real local/Atlas MongoDB seamlessly, or boots an embedded in-memory MongoDB engine automatically with zero manual configuration required!

---

## 📋 Comprehensive Experiment Mapping (BIT-417 Lab File)

| Experiment | Lab Aim & Syllabus Topic | Implementation in Meridian |
| :--- | :--- | :--- |
| **Exp 1** | Case Study of E-Commerce & Tech Stack Formulation | Architecture built on **Node.js, Express.js, MongoDB (NoSQL), EJS, CSS, and JavaScript**. |
| **Exp 2** | Homepage Design | Interactive Hero Carousel (auto-sliding & touch-ready), Search Bar, Brand Logo with Opening Animation, Category Navigation (Men, Women, Kids), Footer with social handles. |
| **Exp 3** | Components Design | Category segmentation (`/products/category/:slug`), Products catalogue, **Admin panel for adding new pieces**, attribute editing, priority of latest items, order placement, and **IN-STOCK / OUT-OF-STOCK state**. |
| **Exp 4** | Form Validation using JavaScript | Robust validation implemented via **`express-validator`** for Client Sign-up (name, email format, password min length 4, password confirmation), Sign-in, and Concierge Contact Inquiry. |
| **Exp 5** | Catalogue Design | Harmonious 4-element product cards: **1. Image, 2. Title, 3. Price, 4. Add to Shopping Bag Button**, with responsive grid layouts. |
| **Exp 6** | Access Control & Identification | **Passport.js Local Strategy** authentication, password hashing via **`bcryptjs`** (`encryptPassword` & `validPassword`), session serialization/deserialization, and Admin role gating. |
| **Exp 7** | Session Management | Stateful HTTP sessions using **`express-session`** with 3-hour cookie lifetime (`maxAge: 60 * 1000 * 60 * 3`), flash messages, and server-side cart state. |
| **Exp 8** | Hadoop Clusters Study | Academic case study documented in the laboratory manual. |
| **Exp 9** | E-Commerce Search Engine | Responsive site search bar with MongoDB `$regex` query matching titles, descriptions, and SKU product codes, complete with pagination. |
| **Exp 10** | Shopping Cart System | Dynamic cart supporting **Add to Cart, Reduce Quantity (-), Add Quantity (+), Remove Item, Real-time Subtotal Calculation, and Secure Checkout with Razorpay payment gateway**. |
| **Exp 11** | Business Models & Payment Gateways | Integration of **Razorpay Payment Gateway** (`rzp_test_U3kIReIGj4JB7C`) supporting UPI, Cards, NetBanking, and Digital Wallets with HMAC-SHA256 signature verification. |

---

## 📁 Project Directory Structure

```
c:\Users\aparn\Desktop\Ecomm\
├── .env                       # Environment variables (PORT, secrets, MongoDB URI)
├── .gitignore                 # Standard Node.js & local storage gitignore
├── app.js                     # Express server entry point & middleware pipeline
├── package.json               # NPM scripts and dependencies
├── README.md                  # Project documentation & lab manual alignment
│
├── config/
│   ├── db.js                  # Dual-mode database manager (MongoDB / In-Memory NoSQL)
│   ├── passport.js            # Passport Local authentication strategies
│   └── validators.js          # Express-validator form validation rules
│
├── middleware/
│   └── index.js               # Route guards (isLoggedIn, isAdmin, isNotLoggedIn)
│
├── models/
│   ├── cart.js                # Shopping cart schema (items, totalQty, totalCost)
│   ├── category.js            # Category schema (Men, Women, Kids)
│   ├── order.js               # Order schema (user, items, address, paymentId)
│   ├── product.js             # Product schema (code, title, price, category, stock)
│   └── user.js                # User schema (username, email, bcrypt password, isAdmin)
│
├── routes/
│   ├── admin.js               # Admin dashboard, product CRUD, category & order management
│   ├── cart.js                # Shopping cart operations & checkout processing
│   ├── pages.js               # Home runway, About Maison, and Concierge Contact
│   ├── products.js            # Product catalog, category filter, search engine
│   └── user.js                # Client authentication (signin, signup, profile, logout)
│
├── seedDB/
│   └── seed.js                # Standalone database seeder with 12 luxury pieces
│
├── public/
│   ├── css/
│   │   └── style.css          # 1,300+ lines of custom luxury noir & gold styling
│   ├── js/
│   │   └── main.js            # SVG logo animation, carousel, mobile menu, alerts
│   ├── uploads/               # Admin product image upload destination
│   └── images/                # Static asset fallbacks
│
└── views/
    ├── error.ejs              # Bespoke 404 error page
    ├── partials/
    │   ├── head.ejs           # HTML headers, Google Fonts (Cormorant Garamond & Montserrat)
    │   ├── navbar.ejs         # Brand logo, search engine, categories dropdown, cart pill
    │   └── footer.ejs         # Four-column footer with contact and social channels
    ├── shop/
    │   ├── home.ejs           # Hero carousel, category mosaic, latest arrivals, quotes
    │   ├── index.ejs          # Catalog with sidebar filters, sorting, and pagination
    │   ├── product.ejs        # High-res product view with in-stock indicators
    │   ├── shopping-cart.ejs  # Cart table, quantity steppers, receipt summary
    │   └── checkout.ejs       # Shipping form and payment instrument selection
    ├── user/
    │   ├── signin.ejs         # Passport local client access
    │   ├── signup.ejs         # Validated account registration
    │   └── profile.ejs        # User portfolio & order timeline
    ├── admin/
    │   ├── dashboard.ejs      # Atelier console metrics, categories, inventory table
    │   ├── add-product.ejs    # Curate new garment with file upload
    │   ├── edit-product.ejs   # Modify piece attributes and stock state
    │   └── orders.ejs         # Client order ledger and delivery toggling
    └── pages/
        ├── about.ejs          # The Maison heritage & BIT-417 academic context
        └── contact.ejs        # Private salon appointments & validated contact inquiry
```

---

## 🚀 How to Run the Website

### Step 1: Install Dependencies (Already performed)
```bash
npm install
```

### Step 2: Start the Application
```bash
npm start
```
*(Alternatively, for live auto-reloading during development: `npm run dev`)*

### Step 3: Open in Browser
Open your favorite web browser and visit:
```
http://localhost:3000
```

---

## 🔑 Demo Credentials

The platform comes pre-seeded with both **Curator (Admin)** and **Client (Customer)** accounts:

### 1. Atelier Curator (Admin Account)
- **Email:** `admin@meridian.style`
- **Password:** `admin123`
- **Privileges:** Access to `/admin` Atelier Console, Add/Edit/Delete creations, manage categories, toggle order delivery statuses.

### 2. Client Profile (Customer Account)
- **Email:** `aparna@test.com`
- **Password:** `user123`
- **Privileges:** Add items to cart, checkout, view personal portfolio and order history.

*(You can also freely create new accounts on the Sign-Up page with automatic form validation!)*

---

## 🎨 Key Features & Architectural Highlights

1. **Signature Opening Logo Animation:**
   Upon loading the site, an SVG diamond compass path dynamically sketches itself on the screen before the serif *MERIDIAN* typography expands with tracking letter-spacing, dissolving smoothly into the homepage runway.

2. **Runway Hero Carousel:**
   Three full-bleed curated editorial slides with automatic progression (5.5s), keyboard/click navigation, and responsive dots.

3. **Multi-Factor Form Validation (Experiment 4):**
   Client-side HTML5 constraints backed by server-side `express-validator` rules to prevent malformed email addresses, weak passwords (< 4 characters), or missing required fields.

4. **Cart & Session Persistence (Experiment 7 & 10):**
   Cart state is tracked per session with automatic subtotal, complimentary shipping calculation, and item-level steppers.

5. **Search Engine with Regular Expressions (Experiment 9):**
   Full-text case-insensitive keyword search across product titles, descriptions, and SKU codes. Press `/` anywhere to focus the search bar!

6. **Order Ledger & State Display (Experiment 3 & 10):**
   Every completed acquisition generates a unique order reference (e.g., `#MRD-2024-X9`), logged in both the customer's personal profile and the admin console with live **IN TRANSIT / DELIVERED** status.

---

*Crafted for the BIT-417 E-Commerce Curriculum at Indira Gandhi Delhi Technical University for Women (IGDTUW).*
