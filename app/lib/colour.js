/*
	Some Math functions
*/


export const lerpRGBColour = (control, from, to) => {
	const r = Math.ceil(from.r + (to.r - from.r) * control);
	const g = Math.ceil(from.g + (to.g - from.g) * control);
	const b = Math.ceil(from.b + (to.b - from.b) * control);
	return { r, g, b };
};


export const HSVtoRGB = (h, s, v, returnHex) => {
	var b, f, g, i, p, q, r, rgb, t;
	if (returnHex === null) {
		returnHex = false;
	}
	if (h && s === void 0 && v === void 0) {
		s = h.s;
		v = h.v;
		h = h.h;
	}
	i = Math.floor(h * 6);
	f = h * 6 - i;
	p = v * (1 - s);
	q = v * (1 - f * s);
	t = v * (1 - (1 - f) * s);
	switch (i % 6) {
	case 0:
		r = v;
		g = t;
		b = p;
		break;
	case 1:
		r = q;
		g = v;
		b = p;
		break;
	case 2:
		r = p;
		g = v;
		b = t;
		break;
	case 3:
		r = p;
		g = q;
		b = v;
		break;
	case 4:
		r = t;
		g = p;
		b = v;
		break;
	case 5:
		r = v;
		g = p;
		b = q;
	}
	rgb = {
		r: Math.floor(r * 255),
		g: Math.floor(g * 255),
		b: Math.floor(b * 255),
	};
	if (returnHex === false) {
		return rgb;
	} else {
		r = r.toString(16);
		g = g.toString(16);
		b = b.toString(16);
		if (r.length === 1) {
			r = "0" + r;
		}
		if (g.length === 1) {
			g = "0" + g;
		}
		if (b.length === 1) {
			b = "0" + b;
		}
		return "#" + r + g + b;
	}
};

export const componentToHex = (c) => {
	const hex = c.toString(16);
	if (hex.length === 1) return '0' + hex;
	return hex;
};

export const rgbToHex = (r, g, b) => {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};
