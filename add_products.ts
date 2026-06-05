import { db } from "./src/server/db.js";
import crypto from "crypto";

(async () => {
  try {
    const p1_id = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO products (
        id, title, description, price, genres, image_main, image_trailer, images, colors, sizes,
        inventory_s, inventory_m, inventory_l, is_box_office_hit, is_coming_soon, is_hidden, mood, franchise, collection_id, sub_collection, season, is_gallery, bts_content, has_color_variants
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p1_id,
        "NO REGRETS",
        "",
        599,
        "[]",
        "https://drive.google.com/file/d/1j8jcZIQ8TBqifq_-ELSE9yN6m5A9txVX/view?usp=drive_link",
        null,
        "[]",
        "[]",
        '["S", "M", "L", "XL", "XXL"]',
        100, 100, 100,
        0, 0, 0,
        null,
        "Attack on Titan",
        "626e7cdb-3dd8-4c70-9f65-2754ce8e1e69",
        null,
        "صيفي",
        0, null, 0
      ]
    });
    console.log("Product 1 added");

    const p2_id = crypto.randomUUID();
    const colors = [
      {
        name: "White",
        image: "https://drive.google.com/file/d/1pXY9fyhxBAin3kffzG613dFTPeOeUOJb/view?usp=drivesdk",
        secondaryImage: ""
      },
      {
        name: "Black",
        image: "https://drive.google.com/file/d/1zm61GZJJTgS1K6e9WhN8_laGfhrKfjGP/view?usp=drivesdk",
        secondaryImage: ""
      }
    ];

    await db.execute({
      sql: `INSERT INTO products (
        id, title, description, price, genres, image_main, image_trailer, images, colors, sizes,
        inventory_s, inventory_m, inventory_l, is_box_office_hit, is_coming_soon, is_hidden, mood, franchise, collection_id, sub_collection, season, is_gallery, bts_content, has_color_variants
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p2_id,
        "Annie Leonhart",
        "",
        599,
        "[]",
        "https://drive.google.com/file/d/1pXY9fyhxBAin3kffzG613dFTPeOeUOJb/view?usp=drivesdk",
        null,
        "[]",
        JSON.stringify(colors),
        '["S", "M", "L", "XL", "XXL"]',
        100, 100, 100,
        0, 0, 0,
        null,
        "Attack on Titan",
        "626e7cdb-3dd8-4c70-9f65-2754ce8e1e69",
        null,
        "صيفي",
        0, null, 1
      ]
    });
    console.log("Product 2 added");

  } catch (err) {
    console.error(err);
  }
})();
