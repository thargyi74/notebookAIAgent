// test-elasticsearch.js
import { Client } from "@elastic/elasticsearch";

async function testElasticsearch() {
  const ports = [9200, 9300, 8080, 80, 443];
  const protocols = ["http", "https"];

  for (const protocol of protocols) {
    for (const port of ports) {
      const configs = [
        // No auth
        { node: `${protocol}://172.104.33.202:${port}` },
        // With auth
        {
          node: `${protocol}://172.104.33.202:${port}`,
          auth: { username: "elastic", password: "changeme" },
        },
      ];

      for (const config of configs) {
        try {
          console.log(`Testing: ${config.node}`);
          const client = new Client(config);
          const info = await client.info();
          console.log("✅ Connection successful with config:", config);
          console.log("Cluster info:", info.body);
          return;
        } catch (error) {
          console.log(`❌ Failed: ${config.node} - ${error.message}`);
        }
      }
    }
  }
  console.log("No successful connections found");
}

testElasticsearch();
