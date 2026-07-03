async function searchImages() {
  try {
    const res = await fetch('/images/search');
    const images = await res.json();
    renderGrid(images);
  } catch (err) {
    console.error(err);
  }
}

async function loadPins() {
  try {
    const res = await fetch('/boards/pins');
    const pins = await res.json();
    renderGrid(pins);
  } catch (err) {
    console.error(err);
  }
}

function renderGrid(items) {
  const grid = document.getElementById('pinGrid');
  grid.innerHTML = items.map(item => `
    <div class="pin-card">
      <img src="${item.url || 'https://picsum.photos/200'}" alt="pin">
      <p>${item.description || 'No description'}</p>
    </div>
  `).join('');
}

loadPins();
