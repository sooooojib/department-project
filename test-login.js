async function main() {
  const identifiers = [
    { id: 'admin@portal.com', type: 'admin', pw: 'adminpass123' },
    { id: 'student@example.com', type: 'student', pw: 'password123' },
    { id: 'teacher@example.com', type: 'teacher', pw: 'password123' }
  ];
  
  for (const user of identifiers) {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: user.id, password: user.pw })
    });
    console.log(`${user.type} login status:`, res.status);
    const data = await res.json();
    console.log(data);
  }
}
main().catch(console.error);
