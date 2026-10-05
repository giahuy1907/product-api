const API_URL = (process.env.API_URL || "http://localhost:3000").replace(/\/$/, "");
const TEST_PID = process.env.TEST_PID || `CITEST-${Date.now()}`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const text = await response.text();

  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  return {
    status: response.status,
    body
  };
}

async function main() {
  console.log(`Testing API: ${API_URL}`);
  console.log(`Test product: ${TEST_PID}`);

  // Health check
  const health = await request("/health");
  assert(health.status === 200, `Health check failed: HTTP ${health.status}`);
  assert(
    health.body.status === "ok" &&
    health.body.mongodb === "connected",
    "Health check returned invalid data"
  );
  console.log("✓ Health check passed");

  // CREATE
  const create = await request("/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pid: TEST_PID,
      pname: "CI Test Product",
      price: 100000,
      quantity: 10
    })
  });

  assert(create.status === 201, `CREATE failed: HTTP ${create.status}`);
  assert(create.body.success === true, "CREATE returned success=false");
  assert(create.body.data?.pid === TEST_PID, "CREATE returned wrong pid");
  console.log("✓ CREATE passed");

  // READ ALL
  const list = await request("/products");
  assert(list.status === 200, `READ ALL failed: HTTP ${list.status}`);
  assert(Array.isArray(list.body.data), "READ ALL returned invalid data");
  assert(
    list.body.data.some(product => product.pid === TEST_PID),
    "Created product was not found in product list"
  );
  console.log("✓ READ ALL passed");

  // READ BY PID
  const read = await request(`/products/${encodeURIComponent(TEST_PID)}`);
  assert(read.status === 200, `READ BY PID failed: HTTP ${read.status}`);
  assert(read.body.data?.pid === TEST_PID, "READ BY PID returned wrong product");
  console.log("✓ READ BY PID passed");

  // UPDATE
  const update = await request(`/products/${encodeURIComponent(TEST_PID)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pname: "CI Test Product Updated",
      price: 200000,
      quantity: 25
    })
  });

  assert(update.status === 200, `UPDATE failed: HTTP ${update.status}`);
  assert(update.body.success === true, "UPDATE returned success=false");
  assert(update.body.data?.price === 200000, "UPDATE price is incorrect");
  assert(update.body.data?.quantity === 25, "UPDATE quantity is incorrect");
  console.log("✓ UPDATE passed");

  // DELETE
  const remove = await request(`/products/${encodeURIComponent(TEST_PID)}`, {
    method: "DELETE"
  });

  assert(remove.status === 200, `DELETE failed: HTTP ${remove.status}`);
  assert(remove.body.success === true, "DELETE returned success=false");
  console.log("✓ DELETE passed");

  // VERIFY DELETE
  const verifyDelete = await request(
    `/products/${encodeURIComponent(TEST_PID)}`
  );

  assert(
    verifyDelete.status === 404,
    `VERIFY DELETE failed: expected HTTP 404, got ${verifyDelete.status}`
  );
  console.log("✓ VERIFY DELETE passed");

  console.log("");
  console.log("=================================");
  console.log("Product API CRUD TEST PASSED");
  console.log("=================================");
}

main().catch(error => {
  console.error("");
  console.error("PRODUCT API CRUD TEST FAILED");
  console.error(error.message);
  process.exit(1);
});
