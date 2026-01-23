// Theme toggle
const themeToggle = document.querySelector('.theme-toggle');
const html = document.documentElement;

// Get system preference
const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

// Apply visual theme (light or dark colors)
const applyVisualTheme = (theme) => {
  // Remove theme classes for colors
  html.classList.remove('theme-light', 'theme-dark');
  if (theme === 'light') {
    html.classList.add('theme-light');
  }
};

// Apply theme mode (system, light, or dark)
const applyThemeMode = (mode) => {
  html.setAttribute('data-theme', mode);

  if (mode === 'system') {
    applyVisualTheme(getSystemTheme());
  } else {
    applyVisualTheme(mode);
  } };

// Initialize theme: saved preference or 'system' default
const savedTheme = localStorage.getItem('theme') || 'system';
applyThemeMode(savedTheme);

// Listen for system theme changes (apply if in system mode)
window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
  if (html.getAttribute('data-theme') === 'system') {
    applyVisualTheme(getSystemTheme());
  }
});

// Toggle theme on button click: system -> light -> dark -> system
themeToggle.addEventListener('click', () => {
  const currentMode = html.getAttribute('data-theme');
  let newMode;

  if (currentMode === 'system') {
    newMode = 'light';
  } else if (currentMode === 'light') {
    newMode = 'dark';
  } else {
    newMode = 'system';
  }

  applyThemeMode(newMode);
  localStorage.setItem('theme', newMode);
});

// Mobile menu toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');

mobileMenuToggle.addEventListener('click', () => {
  const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
  mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
  mobileNav.classList.toggle('active');
});

// Close mobile menu when clicking a link
mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('active');
  });
});

// FAQ accordion
document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const faqItem = button.parentElement;
    const isExpanded = button.getAttribute('aria-expanded') === 'true';

    // Close all other FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
      item.classList.remove('active');
      item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });

    // Toggle current item
    if (!isExpanded) {
      faqItem.classList.add('active');
      button.setAttribute('aria-expanded', 'true');
    }
  });
});

// Scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
  observer.observe(el);
});

// Fetch follower count via Nostr relays (parallel connection)
(function() {
  const pubkeyHex = 'fecb1d78e1210c66afaa3fc92e82a122430d6001b148faba30cf2ae4e6faeff3';
  const relays = ['wss://relay.damus.io', 'wss://nos.lol'];
  const followers = new Set();
  let completed = 0;

  relays.forEach(relay => {
    try {
      const ws = new WebSocket(relay);
      const timeout = setTimeout(() => { ws.close(); checkComplete(); }, 10000);

      ws.onopen = () => {
        ws.send(JSON.stringify(['REQ', 'followers', { kinds: [3], '#p': [pubkeyHex] }]));
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg[0] === 'EVENT' && msg[1] === 'followers') {
            followers.add(msg[2].pubkey);
          } else if (msg[0] === 'EOSE' && msg[1] === 'followers') {
            clearTimeout(timeout);
            ws.close();
            checkComplete();
          }
        } catch {}
      };

      ws.onerror = () => { clearTimeout(timeout); checkComplete(); };
    } catch { checkComplete(); }
  });

  function checkComplete() {
    completed++;
    if (followers.size > 0) {
      document.getElementById('follower-count').textContent = followers.size.toLocaleString();
    }
  }
})();
