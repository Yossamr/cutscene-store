const res = await fetch("http://localhost:3000/api/ai/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages: [{ role: "user", content: "عامل ايه ؟" }] })
});
const text = await res.text();
console.log(res.status, text);
