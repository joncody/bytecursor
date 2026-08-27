# `bytecursor.js` – Cursor-Based Binary Data Reader/Writer

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Module: ESM](https://img.shields.io/badge/Module-ESM-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
[![Dependencies: Zero](https://img.shields.io/badge/Dependencies-0-brightgreen.svg)]()
[![Tests: 82 Passing](https://img.shields.io/badge/Tests-82%20Passing-success.svg)](./tests/index.html)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A zero-dependency, immutable, and bounds-safe wrapper around JavaScript’s `DataView`, designed for **zero-copy sequential binary parsing and serialization** with an internal cursor.

Unlike raw `DataView`, **bytecursor** tracks your position automatically, decodes and encodes UTF-8 strings directly in-buffer, and enforces strict bounds checking—making binary protocol implementation fast, safe, and readable.

---

## ✅ Key Features

- ⏩ **Automatic cursor**: Read/write sequentially without manual offset math  
- ⚡ **Zero-copy operations**: Read byte sequences and strings directly from buffer views without memory cloning  
- 🛡️ **Strict bounds checking**: Prevents out-of-range reads and writes at runtime  
- 🔤 **High-performance UTF-8**: Direct encoding via `TextEncoder.prototype.encodeInto` and zero-copy decoding with `TextDecoder`  
- 📏 **View slicing & subarray views**: Work with subsections of an `ArrayBuffer` efficiently  
- 🔄 **Method chaining**: All write operations return the instance for fluent APIs  
- 🧊 **Immutable & frozen**: The API object and its properties are `Object.freeze`d for safety  
- 📦 **Pure ES module**: Zero dependencies, modern JavaScript only  

> ⚠️ **Note**: All operations happen sequentially at the current cursor position.

---

## 📦 Installation

Place `src/bytecursor.js` in your project and import it:

```js
import bytecursor from './bytecursor.js';
```

---

## 🧪 Quick Example

```js
import bytecursor from './bytecursor.js';

// Create a 16-byte buffer
const cursor = bytecursor(new ArrayBuffer(16));

// Write data sequentially
cursor.writeString("OK")        // UTF-8 encoded directly in-buffer → 2 bytes
      .writeUint8(200)          // → 1 byte
      .writeInt32(12345, true); // little-endian → 4 bytes

console.log(cursor.tell()); // 7

// Read it back
cursor.rewind();
console.log(cursor.getString(2));    // "OK" (zero-copy decode)
console.log(cursor.getUint8());      // 200
console.log(cursor.getInt32(true));  // 12345
```

---

## 📚 API Reference

### 🔧 Initialization

```js
bytecursor(buffer, [viewOffset = 0], [viewLength])
```

- `buffer`: Must be an `ArrayBuffer` (throws `TypeError` otherwise)
- Returns a **frozen** API object with a cursor starting at `0` (relative to the view)

#### Public Properties (Immutable)

| Property | Description |
|--------|-------------|
| `.buffer` | The underlying `ArrayBuffer` |
| `.view` | The underlying `DataView` (with offset/length as provided) |
| `.length` | Byte length of the active view (`number`, not a method) |

---

### 🧭 Cursor Control

| Method | Description |
|-------|-------------|
| `.tell()` | Returns current cursor position (0-based, relative to view start) |
| `.seek(pos)` | Move cursor to absolute position `pos` (within view bounds) |
| `.rewind()` | Reset cursor to `0` |
| `.skip(n)` | Advance cursor by `n` bytes |
| `.eof()` | Returns `true` if cursor ≥ view length |

All cursor methods (except `tell` and `eof`) return the API instance for chaining.

---

### 🔢 Reading Numeric Values

All read methods **advance the cursor** by the size of the type.

| Method | Size | Description |
|-------|------|-------------|
| `.getUint8()` | 1 | Unsigned 8-bit integer |
| `.getInt8()` | 1 | Signed 8-bit integer |
| `.getUint16(littleEndian?)` | 2 | Unsigned 16-bit integer |
| `.getInt16(littleEndian?)` | 2 | Signed 16-bit integer |
| `.getUint32(littleEndian?)` | 4 | Unsigned 32-bit integer |
| `.getInt32(littleEndian?)` | 4 | Signed 32-bit integer |
| `.getFloat32(littleEndian?)` | 4 | 32-bit float |
| `.getFloat64(littleEndian?)` | 8 | 64-bit float |

---

### ✍️ Writing Numeric Values

All write methods advance the cursor and return the API for chaining.

| Method | Example |
|-------|--------|
| `.writeUint8(v)` | `cursor.writeUint8(255)` |
| `.writeInt8(v)` | `cursor.writeInt8(-128)` |
| `.writeUint16(v, littleEndian?)` | `cursor.writeUint16(65535, true)` |
| `.writeInt16(v, littleEndian?)` | `cursor.writeInt16(-32768, true)` |
| `.writeUint32(v, littleEndian?)` | `cursor.writeUint32(4294967295, true)` |
| `.writeInt32(v, littleEndian?)` | `cursor.writeInt32(-2147483648, true)` |
| `.writeFloat32(v, littleEndian?)` | `cursor.writeFloat32(3.14159, true)` |
| `.writeFloat64(v, littleEndian?)` | `cursor.writeFloat64(2.718281828, true)` |

---

### 📄 Bytes & Strings (UTF-8)

| Method | Description |
|-------|-------------|
| `.getBytes([length])` | Returns a zero-copy `Uint8Array` subarray view from cursor (default: remaining view length) |
| `.getString(length)` | Decodes `length` bytes directly from the buffer as a UTF-8 string |
| `.writeBytes(uint8Array)` | Copies a `Uint8Array` into the buffer at cursor position |
| `.writeString(str)` | Encodes UTF-8 string directly into buffer using `encodeInto` (zero intermediate allocation) |

> 🌐 Uses browser-native `TextEncoder` and `TextDecoder` with high-performance UTF-8 stream processing.

---

### ✂️ Buffer Extraction

| Method | Description |
|-------|-------------|
| `.slice(start?, end?)` | Returns an isolated **copied clone** of the underlying buffer from `view.byteOffset + start` to `view.byteOffset + end` |

> 💡 **Tip**: Use `.getBytes()` for zero-copy slice viewing, and `.slice()` when you need an independent cloned `ArrayBuffer`.

---

## 🧪 Testing

This library includes a zero-dependency, comprehensive browser-based verification suite (82 assertions covering 100% of methods, boundary guards, and error conditions).

To run the test suite:

1. Serve the repository using any static web server (e.g., Nginx, Caddy, or Python's `http.server`).
2. Open `tests/index.html` in your browser (e.g., `http://localhost/tests/index.html`).
3. View results visually on the page or open Developer Tools (`F12` -> **Console**) to inspect grouped log outputs and execution metrics.

---

## 🚫 What It *Doesn’t* Do

- ❌ No random-access reading/writing (e.g., `getUint32(12)`)
- ❌ No support for non-UTF-8 encodings
- ❌ No automatic length-prefix handling (you manage string/byte lengths)

This keeps the API minimal, predictable, and focused on **stream-like binary parsing**.

---

## 📄 License

See [LICENSE](./LICENSE) for details.
