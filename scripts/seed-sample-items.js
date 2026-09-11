// scripts/seed-sample-items.js
// Injects 20 sample items into the running server's in-memory storage via POST /api/items

const PORT = process.env.PORT || 3000;
const API_URL = `http://localhost:${PORT}/api/items`;

const sampleItems = [
  {
    type: "found",
    title: "Blue Stainless Steel Water Bottle",
    category: "Other",
    date: "2026-09-02",
    location: "Burwood - Building C Level 2",
    description: "Left on a study bench near the staircase."
  },
  {
    type: "lost",
    title: "MacBook USB-C 67W Charger",
    category: "Electronics",
    date: "2026-09-05",
    location: "Waurn Ponds - Library 1st Floor",
    description: "Apple white charger with long 2m USB-C braided cable."
  },
  {
    type: "found",
    title: "Car Keys with Deakin Lanyard",
    category: "Keys",
    date: "2026-09-08",
    location: "Burwood - Student Central",
    description: "Toyota black electronic key with two silver keys on a navy Deakin lanyard."
  },
  {
    type: "lost",
    title: "Black Leather Bi-fold Wallet",
    category: "Wallets / Cards",
    date: "2026-09-01",
    location: "Waterfront - Courtyard Cafe",
    description: "Black Bellroy leather wallet containing student card and Myki."
  },
  {
    type: "found",
    title: "AirPods Pro (2nd Gen) in White Case",
    category: "Electronics",
    date: "2026-09-09",
    location: "Burwood - LT1 Lecture Hall",
    description: "Found on desk row D after SIT725 lecture."
  },
  {
    type: "lost",
    title: "Navy Herschel Backpack",
    category: "Bags",
    date: "2026-08-28",
    location: "Waurn Ponds - Building KA",
    description: "Navy blue backpack with textbooks and spiral notebook inside."
  },
  {
    type: "found",
    title: "Silver Casio Digital Watch",
    category: "Other",
    date: "2026-09-07",
    location: "Burwood - Fitness Centre",
    description: "Vintage style metal band Casio watch left near locker area."
  },
  {
    type: "lost",
    title: "Calculus & Linear Algebra Textbook",
    category: "Books",
    date: "2026-09-03",
    location: "Burwood - Library Level 3",
    description: "Hardcover textbook with yellow highlights on first 3 chapters."
  },
  {
    type: "found",
    title: "Black Deakin Hoodie (Size M)",
    category: "Clothing",
    date: "2026-09-06",
    location: "Waterfront - Gallery Area",
    description: "Dark navy/black official Deakin university hoodie."
  },
  {
    type: "lost",
    title: "Student ID & Bank Cards in Clear Pouch",
    category: "Wallets / Cards",
    date: "2026-09-04",
    location: "Burwood - Building H Food Court",
    description: "Clear plastic lanyard pouch with Deakin student card and bank card."
  },
  {
    type: "found",
    title: "Logitech MX Master 3 Wireless Mouse",
    category: "Electronics",
    date: "2026-09-10",
    location: "Waurn Ponds - Computer Lab KE1.205",
    description: "Dark grey ergonomic mouse left next to terminal 14."
  },
  {
    type: "lost",
    title: "House Keys with Red Carabiner",
    category: "Keys",
    date: "2026-08-30",
    location: "Burwood - Car Park 2",
    description: "Set of three keys with a miniature red Swiss army knife attached."
  },
  {
    type: "found",
    title: "Grey Sony Noise-Cancelling Headphones",
    category: "Electronics",
    date: "2026-09-08",
    location: "Waterfront - Study Booth 4",
    description: "Sony WH-1000XM4 grey wireless headphones in black zip case."
  },
  {
    type: "lost",
    title: "Silver Apple iPad Air (5th Gen)",
    category: "Electronics",
    date: "2026-09-09",
    location: "Burwood - Building BC Atrium",
    description: "Space grey with green magnetic smart folio case."
  },
  {
    type: "found",
    title: "Ray-Ban Tortoiseshell Sunglasses",
    category: "Other",
    date: "2026-09-05",
    location: "Waurn Ponds - Lakeside Lawn",
    description: "Wayfarer classic model with brown protective leather pouch."
  },
  {
    type: "lost",
    title: "Black North Face Rain Jacket",
    category: "Clothing",
    date: "2026-08-25",
    location: "Burwood - Bus Loop Shelter",
    description: "Waterproof windbreaker jacket size Large left on bench."
  },
  {
    type: "found",
    title: "Scientific Calculator Casio fx-82AU",
    category: "Electronics",
    date: "2026-09-04",
    location: "Burwood - Building LB Exam Hall",
    description: "Name sticker 'Sam' on the inside protective cover."
  },
  {
    type: "lost",
    title: "Beige Canvas Tote Bag",
    category: "Bags",
    date: "2026-09-06",
    location: "Waterfront - Library Floor 2",
    description: "Tote bag with art print on front and pencil case inside."
  },
  {
    type: "found",
    title: "Black Samsung Galaxy Watch 4",
    category: "Electronics",
    date: "2026-09-07",
    location: "Waurn Ponds - Sports Hall",
    description: "Black silicone strap, PIN locked screen."
  },
  {
    type: "lost",
    title: "Gold Rimmed Reading Glasses",
    category: "Other",
    date: "2026-08-22",
    location: "Burwood - Coffee Cart",
    description: "Oval shaped prescription glasses in a hard brown case."
  },
  {
    type: "found",
    title: "Anker 20,000mAh Power Bank",
    category: "Electronics",
    date: "2026-09-09",
    location: "Burwood - Building HE Level 1",
    description: "Black matte portable battery with dual USB-C ports."
  },
  {
    type: "lost",
    title: "Dell XPS 15 Laptop Charger",
    category: "Electronics",
    date: "2026-09-08",
    location: "Waurn Ponds - Library 2nd Floor",
    description: "Black 130W USB-C oval charger with Australian power plug."
  },
  {
    type: "found",
    title: "Deakin Student ID Card - Emily W.",
    category: "Wallets / Cards",
    date: "2026-09-06",
    location: "Burwood - Student Central",
    description: "Card ending in student number 2210. Handed to reception desk."
  },
  {
    type: "lost",
    title: "AirPods Max Silver Wireless Headphones",
    category: "Electronics",
    date: "2026-09-07",
    location: "Waterfront - John Hay Building",
    description: "Silver Apple over-ear headphones with white smart case."
  },
  {
    type: "found",
    title: "Grey Knit Scarf & Gloves Set",
    category: "Clothing",
    date: "2026-09-03",
    location: "Waurn Ponds - Building IC Bus Stop",
    description: "Thick woollen dark grey scarf with matching gloves."
  },
  {
    type: "lost",
    title: "TI-Nspire CX II CAS Calculator",
    category: "Electronics",
    date: "2026-09-02",
    location: "Burwood - Building F Tutorial Room 2.01",
    description: "Colour graphing calculator with blue slider case."
  },
  {
    type: "found",
    title: "Set of Mazda Car Keys on Red Ribbon",
    category: "Keys",
    date: "2026-09-05",
    location: "Burwood - Multi-level Car Park Level 3",
    description: "Electronic Mazda key fob with two small locker keys."
  },
  {
    type: "lost",
    title: "Black Hydro Flask 32oz",
    category: "Other",
    date: "2026-08-31",
    location: "Waterfront - Student Lounge",
    description: "Wide mouth bottle with sticker of Deakin Computing Club."
  },
  {
    type: "found",
    title: "Green Umbrella with Wooden Handle",
    category: "Other",
    date: "2026-09-01",
    location: "Burwood - Building LC Main Entrance",
    description: "Dark green classic umbrella left in the umbrella stand."
  },
  {
    type: "lost",
    title: "Motorcycle Helmet HJC (Size M)",
    category: "Other",
    date: "2026-08-29",
    location: "Waurn Ponds - Bike Shed near Building JB",
    description: "Matte black full-face helmet with tinted visor."
  }
];

async function inject() {
  console.log(`Injecting ${sampleItems.length} sample items into ${API_URL}...`);

  let added = 0;
  for (const item of sampleItems) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });

      if (response.ok) {
        added++;
        console.log(`  [${item.type.toUpperCase()}] ${item.title} (${item.date})`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(`  Failed to add "${item.title}": ${errorData.message || response.status}`);
      }
    } catch (err) {
      console.error(`  Connection error: Is the server running on http://localhost:${PORT}?`);
      console.error(`    ${err.message}`);
      process.exit(1);
    }
  }

  console.log(`\nSuccessfully injected ${added}/${sampleItems.length} items!`);
  console.log("Open http://localhost:3000/browse.html to test sorting and tabs.");
}

inject();
