describe('Click to Conversion Flow (JWT-protected)', () => {
  it('records a click (affiliate) and a conversion (admin)', () => {
    // Create affiliate user and get token
    const affEmail = `aff+${Date.now()}@demo.test`;
    cy.request('POST', '/auth/signup', { email: affEmail, password: 'password', role: 'affiliate' })
      .then((r) => r.body.token)
      .then((affToken) => {
        // Post click as affiliate
        return cy.request({
          method: 'POST', url: '/clicks',
          headers: { Authorization: `Bearer ${affToken}` },
          body: { offerId: 'offer-1', affiliateId: 'aff-1', ip: '1.2.3.4', ua: 'cypress' }
        }).then((res) => ({ clickId: res.body.id, affToken }));
      })
      .then(({ clickId }) => {
        // Create admin and record conversion
        const adminEmail = `admin+${Date.now()}@demo.test`;
        return cy.request('POST', '/auth/signup', { email: adminEmail, password: 'password', role: 'admin' })
          .then((r) => r.body.token)
          .then((adminToken) => {
            return cy.request({
              method: 'POST', url: '/conversions',
              headers: { Authorization: `Bearer ${adminToken}` },
              body: { clickId, payout: 10.5 }
            }).its('status').should('eq', 202);
          });
      });
  });
});
