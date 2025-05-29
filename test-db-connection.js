import "dotenv/config";
import WordPressDatabase from "./src/database.js";

async function testConnection() {
  console.log("Testing database connection...");
  console.log("Environment variables:");
  console.log("DB_HOST:", process.env.DB_HOST);
  console.log("DB_PORT:", process.env.DB_PORT);
  console.log("DB_USER:", process.env.DB_USER);
  console.log("DB_NAME:", process.env.DB_NAME);
  console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "***" : "undefined");

  const db = new WordPressDatabase();

  try {
    console.log("\n🔄 Attempting to connect...");
    await db.connect();
    console.log("✅ Connection successful!");

    // Test a simple query
    console.log("\n🔄 Testing getAllPosts...");
    try {
      const posts = await db.getAllPosts(5);
      console.log(`✅ Query successful! Found ${posts.length} posts`);
    } catch (queryError) {
      if (queryError.code === "ER_NO_SUCH_TABLE") {
        console.log(
          "ℹ️  dvp_posts table doesn't exist yet - that's normal for a fresh database"
        );
      } else {
        console.error("Query error:", queryError.message);
      }
    }

    await db.disconnect();
    console.log("✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testConnection();
