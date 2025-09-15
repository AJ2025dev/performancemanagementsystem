describe('Media-buy workflows (JWT-protected)', () => {
  it('creates, updates campaign and fetches stats', () => {
    const adminEmail = `admin+${Date.now()}@demo.test`;
    cy.request('POST', '/auth/signup', { email: adminEmail, password: 'password', role: 'admin' })
      .then((r) => r.body.token)
      .then((token) => {
        cy.request({
          method: 'POST', url: '/media/campaigns',
          headers: { Authorization: `Bearer ${token}` },
          body: { platform: 'facebook', input: { name: 'Test', budget: 100, objective: 'conversions' } }
        }).then((res) => {
          expect(res.status).to.eq(201);
          const id = res.body.id;
          cy.request({
            method: 'PUT', url: `/media/campaigns/${id}`,
            headers: { Authorization: `Bearer ${token}` },
            body: { platform: 'facebook', input: { status: 'paused' } }
          }).its('status').should('eq', 200);
          cy.request({
            method: 'GET', url: '/media/stats?platform=facebook&from=2024-01-01&to=2024-12-31',
            headers: { Authorization: `Bearer ${token}` }
          }).its('status').should('eq', 200);
        });
      });
  });
});
