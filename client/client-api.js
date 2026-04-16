/* ==========================================================================
   CLIENT PORTAL — API client
   Separate codebase from ops app (architecture rule). Reuses the same
   backend data in demo mode via script tags, but reads/writes only
   through ClientApi.*.  Magic-link authentication per spec §U.

   Token format (demo only — real deployment uses SHA256 signed):
   base64-url-encoded JSON:
     { "c": "c.littlecae", "s": "LCE-2026", "qid": "q.LCE-2026.v3", "exp": ISO }
   ========================================================================== */

(function(){
  window.ClientApi = {};

  ClientApi.parseToken = () => {
    const t = new URL(location.href).searchParams.get('token');
    if (!t) {
      // Default demo identity: LCE contact on LCE-2026 quote
      return {
        clientId: 'c.littlecae',
        projectCode: 'LCE-2026',
        quoteId: 'q.LCE-2026.v3',
        exp: null
      };
    }
    try {
      const json = atob(t.replace(/-/g, '+').replace(/_/g, '/'));
      const obj = JSON.parse(json);
      return {
        clientId: obj.c,
        projectCode: obj.s,
        quoteId: obj.qid,
        exp: obj.exp || null
      };
    } catch (e) {
      return null;
    }
  };

  ClientApi.isExpired = (ctx) => {
    if (!ctx || !ctx.exp) return false;
    return new Date(ctx.exp) < new Date();
  };

  // Who am I? Returns the "portal-facing" identity — client contact record
  // plus the show context. No PCG internal identity.
  ClientApi.getMe = () => {
    const ctx = ClientApi.parseToken();
    if (!ctx || ClientApi.isExpired(ctx)) return null;
    const client = (window.PCG && window.PCG.clients || []).find(c => c.id === ctx.clientId);
    const contacts = (window.PCG && window.PCG.clientContacts || []).filter(c => c.clientId === ctx.clientId);
    const project = (window.PCG && window.PCG.projects || []).find(p => p.code === ctx.projectCode);
    if (!client || !project) return null;
    return {
      clientId: client.id,
      clientName: client.name,
      projectCode: project.code,
      projectName: project.name,
      primaryContact: contacts.find(c => c.portalAccess === 'Full') || contacts[0] || null,
      accountLead: (window.PCG && window.PCG.people || []).find(p => p.id === project.aeId)
    };
  };

  // Proposal = issued quote revision — redacted (no cost, no margin, no corrections).
  ClientApi.getProposal = () => {
    const ctx = ClientApi.parseToken();
    if (!ctx) return null;
    const quote = (window.PCG && window.PCG.quotes || []).find(q => q.id === ctx.quoteId);
    if (!quote) return null;
    const rev = (window.PCG && window.PCG.quoteRevisions || []).find(r => r.id === quote.activeRevisionId);
    if (!rev) return null;
    // Group lines by package for presentation
    const byPkg = {};
    (rev.lines || []).forEach(l => {
      (byPkg[l.packageName || 'Other'] = byPkg[l.packageName || 'Other'] || []).push({
        id: l.id,
        description: l.description,
        qty: l.qty,
        days: l.days,
        extended: (l.unitPrice || 0) * (l.qty || 0) * (l.days || 1)
        // Intentionally no unitPrice, no cost, no margin — client sees extended only by package
      });
    });
    return {
      quoteId: quote.id,
      quoteNo: quote.quoteNo,
      projectCode: quote.projectCode,
      revisionNumber: rev.revisionNumber,
      status: rev.status,
      totalRevenue: rev.totalRevenue,
      termsText: quote.termsText,
      issuedAt: rev.issuedAt || rev.createdAt,
      clientApprovedAt: rev.clientApprovedAt || null,
      lineGroups: Object.entries(byPkg).map(([pkg, lines]) => ({
        packageName: pkg,
        lines,
        subtotal: lines.reduce((s, l) => s + l.extended, 0)
      }))
    };
  };

  // Client-visible production schedule. Strips internal milestones.
  ClientApi.getSchedule = () => {
    const ctx = ClientApi.parseToken();
    if (!ctx) return null;
    const project = (window.PCG && window.PCG.projects || []).find(p => p.code === ctx.projectCode);
    if (!project) return null;
    const venue = (window.PCG && window.PCG.venues || []).find(v => v.id === project.venueId);
    return {
      loadIn: project.dates.loadIn,
      showStart: project.dates.showStart,
      showEnd: project.dates.showEnd || project.dates.loadOut,
      loadOut: project.dates.loadOut,
      venue: venue ? {
        name: venue.name,
        address: venue.address,
        loadInNotes: venue.loadInNotes
      } : null
    };
  };

  // Pinned, client-visible documents only.
  ClientApi.getDocuments = () => {
    const ctx = ClientApi.parseToken();
    if (!ctx) return [];
    const project = (window.PCG && window.PCG.projects || []).find(p => p.code === ctx.projectCode);
    if (!project || !project.docs) return [];
    return project.docs
      .filter(d => d.pinned || d.clientVisible)
      .map(d => ({
        title: d.title,
        kind: d.kind,
        pinned: d.pinned,
        url: d.url || '#'
      }));
  };

  ClientApi.getMessages = () => {
    const ctx = ClientApi.parseToken();
    if (!ctx) return [];
    return (window.PCG && window.PCG.clientMessages || [])
      .filter(m => m.clientId === ctx.clientId && m.projectCode === ctx.projectCode)
      .sort((a, b) => new Date(a.at) - new Date(b.at));
  };

  ClientApi.postMessage = (body) => {
    const ctx = ClientApi.parseToken();
    if (!ctx) return null;
    const me = ClientApi.getMe();
    return PCG.api.postClientMessage({
      clientId: ctx.clientId,
      projectCode: ctx.projectCode,
      fromSide: 'client',
      fromName: me && me.primaryContact ? me.primaryContact.name : me.clientName,
      body
    });
  };

  ClientApi.approveQuote = (comment) => {
    const ctx = ClientApi.parseToken();
    if (!ctx) return null;
    const quote = (window.PCG && window.PCG.quotes || []).find(q => q.id === ctx.quoteId);
    if (!quote) return null;
    const me = ClientApi.getMe();
    return PCG.api.recordClientApproval({
      quoteId: ctx.quoteId,
      quoteRevisionId: quote.activeRevisionId,
      clientId: ctx.clientId,
      projectCode: ctx.projectCode,
      action: 'Approved',
      comment: comment || '',
      byEmail: me && me.primaryContact ? me.primaryContact.email : null
    });
  };

  ClientApi.requestChanges = (comment) => {
    const ctx = ClientApi.parseToken();
    if (!ctx) return null;
    const quote = (window.PCG && window.PCG.quotes || []).find(q => q.id === ctx.quoteId);
    if (!quote) return null;
    const me = ClientApi.getMe();
    return PCG.api.recordClientApproval({
      quoteId: ctx.quoteId,
      quoteRevisionId: quote.activeRevisionId,
      clientId: ctx.clientId,
      projectCode: ctx.projectCode,
      action: 'ChangesRequested',
      comment: comment || '',
      byEmail: me && me.primaryContact ? me.primaryContact.email : null
    });
  };

  ClientApi.getApprovalHistory = () => {
    const ctx = ClientApi.parseToken();
    if (!ctx) return [];
    return PCG.api.getClientApprovals({ quoteId: ctx.quoteId });
  };

})();
