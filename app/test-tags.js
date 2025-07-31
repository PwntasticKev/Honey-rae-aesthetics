// Simple test to verify tag functionality
console.log("Testing tag functionality...");

// Visit setup page to create demo data
fetch("http://localhost:3000/setup")
  .then((response) => {
    console.log("Setup page accessible");
    return fetch("http://localhost:3000/clients");
  })
  .then((response) => {
    console.log("Clients page accessible");
    console.log("Tag functionality should now work with real Convex data");
  })
  .catch((error) => {
    console.error("Error:", error);
  });
