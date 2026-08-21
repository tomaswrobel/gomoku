// @ts-nocheck -- plain classic Worker script, loads the untyped Rapfi WASM glue via importScripts.
importScripts("/rapfi/rapfi-single-simd128.js");

let mod = null;
let lineBuffer = [];

function handleLine(line) {
	lineBuffer.push(line);
}

async function init() {
	mod = await self.Rapfi({
		onReceiveStdout: handleLine,
		onReceiveStderr: () => {},
		locateFile: (path) => `/rapfi/${path}`,
	});
}

// mod.sendCommand() runs gomocupLoopOnce() synchronously (single-threaded build), so by the time it
// returns, every line the command will ever produce has already been pushed to lineBuffer. Some
// commands (e.g. INFO) never print anything at all, so we must not wait for a reply that never comes.
function sendCommand(command) {
	lineBuffer = [];
	mod.sendCommand(command);

	const errors = lineBuffer
		.filter((line) => line.startsWith("ERROR"))
		.map((line) => line.slice(6));
	const reply =
		lineBuffer.find((line) => !line.startsWith("MESSAGE") && !line.startsWith("ERROR")) ?? "";
	return { reply, errors };
}

self.onmessage = async (event) => {
	const { id, command } = event.data;
	try {
		if (command === "__init__") {
			await init();
			self.postMessage({ id, result: { reply: "OK", errors: [] } });
			return;
		}
		self.postMessage({ id, result: sendCommand(command) });
	} catch (error) {
		self.postMessage({ id, error: String(error) });
	}
};
