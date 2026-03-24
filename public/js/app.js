/* ============================================================
   Bifröst UI — Vanilla JS für interaktive Komponenten
   Keine externen Abhängigkeiten | ESM-fähig
   ============================================================ */

/* ── Tabs ────────────────────────────────────────────────── */
document.querySelectorAll('[data-tabs]').forEach(($root) => {
	const tabBtns   = $root.querySelectorAll('.tab-btn, .tab-item a');
	const tabPanels = $root.querySelectorAll('.tab-panel');

	const activate = ($btn) => {
		const target = $btn.dataset.tab || $btn.getAttribute('href')?.replace('#', '');
		tabBtns.forEach($b => {
			$b.classList.remove('active');
			$b.closest('li')?.classList.remove('active');
		});
		$btn.classList.add('active');
		$btn.closest('li')?.classList.add('active');
		tabPanels.forEach($p => $p.classList.toggle('active', $p.id === target));
	};

	tabBtns.forEach($btn => {
		$btn.addEventListener('click', ($e) => {
			$e.preventDefault();
			activate($btn);
		});
	});

	if (tabBtns[0]) activate(tabBtns[0]);
});

/* ── Dropdown ────────────────────────────────────────────── */
document.querySelectorAll('[data-dropdown]').forEach(($trigger) => {
	const $menu = $trigger.nextElementSibling;
	if (!$menu?.classList.contains('dropdown-menu')) return;

	$trigger.addEventListener('click', ($e) => {
		$e.stopPropagation();
		const isOpen = $menu.classList.toggle('open');
		$trigger.setAttribute('aria-expanded', isOpen);
	});
});

document.addEventListener('click', () => {
	document.querySelectorAll('.dropdown-menu.open').forEach($m => {
		$m.classList.remove('open');
		$m.previousElementSibling?.setAttribute('aria-expanded', 'false');
	});
});

/* ── Background Canvas (Cursor Glow) ─────────────────── */
(function () {
	const canvas = document.getElementById('bg-canvas');
	if (!canvas) return;
	const ctx = canvas.getContext('2d');

	const EASE      = 0.08;
	const GLOW_R    = 380;
	const isTouchOnly = window.matchMedia('(pointer: coarse)').matches;

	let W = 0, H = 0;
	let mx = -9999, my = -9999, cx = -9999, cy = -9999;

	function isDark() {
		return document.documentElement.dataset.theme === 'dark'
			|| (document.documentElement.dataset.theme !== 'light'
				&& window.matchMedia('(prefers-color-scheme: dark)').matches);
	}

	function resize() {
		const dpr = window.devicePixelRatio || 1;
		W = window.innerWidth;
		H = window.innerHeight;
		canvas.width  = W * dpr;
		canvas.height = H * dpr;
		ctx.scale(dpr, dpr);
	}

	function draw() {
		ctx.clearRect(0, 0, W, H);

		if (cx > -1000) {
			const glowColor = isDark() ? 'rgba(121,134,203,0.22)' : 'rgba(99,102,241,0.13)';
			const glowFade  = isDark() ? 'rgba(121,134,203,0.04)' : 'rgba(99,102,241,0.02)';
			const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, GLOW_R);
			grad.addColorStop(0,   glowColor);
			grad.addColorStop(0.5, glowFade);
			grad.addColorStop(1,   'transparent');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, W, H);
		}

		cx += (mx - cx) * EASE;
		cy += (my - cy) * EASE;

		requestAnimationFrame(draw);
	}

	resize();
	window.addEventListener('resize', resize, { passive: true });

	if (!isTouchOnly) {
		document.addEventListener('mousemove', ($e) => {
			mx = $e.clientX;
			my = $e.clientY;
		}, { passive: true });
	}

	draw();

	// Muster wechseln: BifrostPattern.set('grid') | 'dots' | 'scanlines' | 'diamond' | 'mychg' | 'none'
	window.BifrostPattern = {
		set($name) {
			const el = document.getElementById('bg-pattern');
			if (el) el.className = `pattern--${$name}`;
		},
	};
}());

/* ── Accordion ───────────────────────────────────────────── */
document.querySelectorAll('.accordion-header').forEach(($btn) => {
	$btn.addEventListener('click', () => {
		const $body = $btn.nextElementSibling;
		const isOpen = $body.classList.toggle('open');
		$btn.classList.toggle('open', isOpen);
		$btn.setAttribute('aria-expanded', isOpen);
	});
});

/* ── Modal ───────────────────────────────────────────────── */
const openModal = ($id) => {
	const $overlay = document.querySelector(`[data-modal="${$id}"]`);
	if (!$overlay) return;
	$overlay.classList.add('open');
	document.body.style.overflow = 'hidden';
	$overlay.querySelector('.modal-close, [data-modal-close]')
		?.focus();
};

const closeModal = ($id) => {
	const $overlay = document.querySelector(`[data-modal="${$id}"]`);
	if (!$overlay) return;
	$overlay.classList.remove('open');
	document.body.style.overflow = '';
};

/* Trigger: <button data-modal-open="my-modal"> */
document.querySelectorAll('[data-modal-open]').forEach($btn => {
	$btn.addEventListener('click', () => openModal($btn.dataset.modalOpen));
});

/* Schließen via .modal-close oder Klick auf Overlay */
document.querySelectorAll('.modal-overlay').forEach($overlay => {
	$overlay.addEventListener('click', ($e) => {
		if ($e.target === $overlay) closeModal($overlay.dataset.modal);
	});
	$overlay.querySelector('.modal-close, [data-modal-close]')
		?.addEventListener('click', () => closeModal($overlay.dataset.modal));
});

/* Escape-Taste schließt offene Modals */
document.addEventListener('keydown', ($e) => {
	if ($e.key !== 'Escape') return;
	document.querySelectorAll('.modal-overlay.open').forEach($o => {
		closeModal($o.dataset.modal);
	});
});

/* Öffentliche API */
window.BifrostUI = { openModal, closeModal };

/* ── Theme Toggle ──────────────────────────────────────────── */
const $themeToggle = document.getElementById('theme-toggle');
if ($themeToggle) {
	const updateIcon = () => {
		const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
			|| (document.documentElement.getAttribute('data-theme') == null
				&& window.matchMedia('(prefers-color-scheme: dark)').matches);
		$themeToggle.textContent = isDark ? '☀️' : '🌙';
	};

	$themeToggle.addEventListener('click', () => {
		const current = document.documentElement.getAttribute('data-theme');
		const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const isDark = current === 'dark' || (current == null && systemDark);
		const next = isDark ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', next);
		localStorage.setItem('bifrost-theme', next);
		updateIcon();
	});

	updateIcon();
}
