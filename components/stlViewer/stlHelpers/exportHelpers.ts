export function saveString(text, filename, link) {
	save( new Blob( [ text ], { type: 'text/plain' } ), filename, link );
}

export const saveArrayBuffer = (buffer, filename, link) => {
	save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename, link );
}

const save = (blob, filename, link) => {
	link.href = URL.createObjectURL( blob );
	link.download = filename;
	link.click();
}

