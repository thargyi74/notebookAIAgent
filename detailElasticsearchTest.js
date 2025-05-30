import { Client } from "@elastic/elasticsearch";

async function detailedElasticsearchTest() {
  const baseUrl = "http://172.104.33.202:80";

  console.log(`\n🔍 Testing Elasticsearch endpoints on ${baseUrl}\n`);

  // Test different Elasticsearch endpoints
  const endpoints = [
    "/",
    "/_cluster/health",
    "/_cat/indices",
    "/elasticsearch",
    "/elasticsearch/",
    "/elasticsearch/_cluster/health",
    "/es",
    "/es/",
    "/es/_cluster/health",
  ];

  for (const endpoint of endpoints) {
    try {
      const url = `${baseUrl}${endpoint}`;
      console.log(`Testing endpoint: ${url}`);

      const response = await fetch(url);
      const text = await response.text();

      console.log(`✅ Status ${response.status}: ${url}`);
      console.log(`Response: ${text.substring(0, 200)}...\n`);

      // If this looks like Elasticsearch, test with the client
      if (text.includes("elasticsearch") || text.includes("cluster_name")) {
        console.log(
          "🎯 Found Elasticsearch-like response, testing with client..."
        );
        const client = new Client({ node: url });
        const info = await client.info();
        console.log("✅ Elasticsearch client connected successfully!");
        console.log("Cluster info:", info.body);
        return url;
      }
    } catch (error) {
      console.log(`❌ Failed: ${baseUrl}${endpoint} - ${error.message}\n`);
    }
  }

  console.log("No Elasticsearch endpoints found");
  return null;
}

detailedElasticsearchTest();
