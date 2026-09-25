import pg from "pg";
import { readFile } from "node:fs/promises";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const ssl = process.env.DB_SSL === "true"
  ? {
      rejectUnauthorized: true,
      ...(process.env.DB_CA_CERT_PATH
        ? { ca: await readFile(process.env.DB_CA_CERT_PATH, "utf8") }
        : {}),
    }
  : undefined;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl });

const products = [
  ["p-strawberry-jam", "Strawberry Jam", "Jam", "A chunky strawberry spread.", "/images/products/kaya-strawberry-jam.webp", "AI illustration of strawberry jam in a ceramic bowl with fresh strawberries", "available", [{ id: "s-350g", label: "350g", price: 3500 }, { id: "s-600g", label: "600g", price: 6000 }]],
  ["p-passion-juice", "Passion Fruit Juice", "Juices", "Passion fruit juice.", "/images/products/kaya-passion-fruit-juice.webp", "AI illustration of golden passion fruit juice in a glass beside halved passion fruits", "coming_soon", [{ id: "s-500ml", label: "500ml", price: 2500 }, { id: "s-1l", label: "1L", price: 4500 }]],
  ["p-akabanga-chilli", "Fiery Chilli Paste", "Chilli", "A vibrant blend of Rwandan chillies.", "/images/products/kaya-chilli-paste.webp", "AI illustration of red chilli paste in a green ceramic dish with fresh chillies", "coming_soon", [{ id: "s-100g", label: "100g", price: 2000 }]],
  ["p-tomato-paste", "Rich Tomato Paste", "Tomato Paste", "Concentrated local tomatoes.", "/images/products/kaya-tomato-paste.webp", "AI illustration of tomato paste in a ceramic ramekin beside ripe tomatoes", "coming_soon", [{ id: "s-200g", label: "200g", price: 1500 }, { id: "s-400g", label: "400g", price: 2800 }]],
  ["p-mango-jam", "Mango Passion Jam", "Jam", "Mango and passion fruit blended into a bright tropical jam.", "/images/products/kaya-mango-preserve.webp", "AI illustration of mango passion jam in a ceramic bowl beside sliced mango", "available", [{ id: "s-350g", label: "350g", price: 3800 }, { id: "s-600g", label: "600g", price: 6500 }]],
] as const;

await client.connect();
try {
  await client.query("BEGIN");
  for (const product of products) {
    await client.query(
      `INSERT INTO products (id, name, category, short_description, image_url, alt_text, availability, sizes, is_sample, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,true) ON CONFLICT (id) DO NOTHING`,
      [...product.slice(0, 7), JSON.stringify(product[7])],
    );
  }
  await client.query(
    `INSERT INTO settings (key,name,description,whatsapp_number,contact_email,contact_phone,opening_hours,delivery_areas,delivery_fee,payment_methods,social_links,hero_badge,hero_text,story_title,story_paragraph_1,story_paragraph_2,story_image_url,story_image_alt,story_image_caption,logo_url,illustration_notice)
     VALUES ('site',$1,$2,'','','','','','','',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (key) DO NOTHING`,
    [
      "kaya foods",
      "Good food. Thoughtfully selected.",
      JSON.stringify({ instagram: "", facebook: "" }),
      "Local • Fresh • Selected",
      "Discover a growing selection of locally made foods from Rwanda, starting with everyday favourites for your pantry.",
      "Quality foods, made in Rwanda.",
      "Kaya Foods was created with a simple idea: to make it easier to discover and enjoy the pantry staples being produced right here in Rwanda.",
      "We spend our time selecting products that meet our standards. Every item in our catalogue represents local agriculture and the skill of local makers.",
      "/images/products/kaya-rwandan-pantry.webp",
      "AI illustration of a woven basket filled with tomatoes, mangoes, passion fruit, chillies and greens",
      "AI-generated illustration · not a supplier or farm photograph",
      "/images/brand/kaya-wordmark.png",
      "Presentation preview: products, sizes and prices are samples. AI-generated images are illustrative, not photographs of Kaya’s actual products.",
    ],
  );
  await client.query("COMMIT");
  process.stdout.write("Seed complete (existing rows preserved).\n");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
