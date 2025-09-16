export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Affiliate & Media-Buy Platform</h1>
      <section>
        <h2>Quick Links</h2>
        <ul>
          <li><a href="/dashboard">Dashboard</a></li>
          <li><a href="/login">Login/Signup</a></li>
          <li><a href="/media">Media Stats</a></li>
          <li><a href="/tools">AI Tools</a></li>
          <li><a href="/track">Track Demo</a></li>
          <li><a href="/offers">Offers</a></li>
          <li><a href="/affiliates">Affiliates</a></li>
          <li><a href="/users">Users</a></li>
        </ul>
      </section>
    </main>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
