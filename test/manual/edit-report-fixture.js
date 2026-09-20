'use strict';

const previewParams = new URLSearchParams(window.location.search);
const previewType = previewParams.get('type') === 'lost' ? 'lost' : 'found';
const previewOwner = '650000000000000000000001';
const previewReport = {
  _id: '650000000000000000000101',
  ownerId: previewOwner,
  type: previewType,
  title: previewType === 'found' ? 'Blue Water Bottle' : 'Black Leather Wallet',
  category: previewType === 'found' ? 'Bottles & Containers' : 'Cards & Wallets',
  description: previewType === 'found'
    ? 'Blue metal bottle handed to the campus security desk.'
    : 'Black wallet containing a student card, last seen near the library.',
  date: '2026-09-01',
  campusLocation: 'Burwood, Building LC, Level 2',
  contactMethod: 'collection',
  collectionLocation: 'Burwood Campus Security Desk',
  status: 'active',
  photos: []
};

const previewBanner = document.createElement('div');
previewBanner.className = 'form-alert alert-info';
previewBanner.textContent = 'Form preview — sample data only. Changes are not saved. ';
for (const [label, query] of [
  ['Found report', '?type=found'], ['Lost report', '?type=lost'], ['Non-owner', '?access=other']
]) {
  const link = document.createElement('a');
  link.href = query;
  link.textContent = label;
  previewBanner.append(link, document.createTextNode(' · '));
}
document.querySelector('.edit-container').prepend(previewBanner);
window.editReportForm.mount({
  report: previewReport,
  currentUserId: previewParams.get('access') === 'other' ? 'another-user' : previewOwner,
  onSave: async () => ({ saved: false, message: 'Validation passed. Preview only: changes have not been saved.' })
});
