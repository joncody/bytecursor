import bytecursor from "../../../src/bytecursor.js";

function is_array_buffer(value) {
    return (
        typeof value === "object" &&
        value !== null &&
        Object.prototype.toString.call(value) === "[object ArrayBuffer]"
    );
}

function is_data_view(value) {
    return (
        typeof value === "object" &&
        value !== null &&
        Object.prototype.toString.call(value) === "[object DataView]"
    );
}

function is_uint8_array(value) {
    return (
        typeof value === "object" &&
        value !== null &&
        Object.prototype.toString.call(value) === "[object Uint8Array]"
    );
}

function create_test_runner() {
    const results_container = document.getElementById("test-results");
    const summary_container = document.getElementById("summary");

    let total_assertions = 0;
    let passed_assertions = 0;
    let failed_assertions = 0;
    let current_group_body = null;

    function group(title) {
        if (current_group_body !== null) {
            console.groupEnd();
        }
        console.group(title);

        const group_el = document.createElement("div");
        group_el.className = "test-group";

        const header_el = document.createElement("div");
        header_el.className = "group-header";
        header_el.textContent = title;

        current_group_body = document.createElement("div");
        current_group_body.className = "group-body";

        group_el.appendChild(header_el);
        group_el.appendChild(current_group_body);
        results_container.appendChild(group_el);
    }

    function assert(condition, message) {
        total_assertions += 1;
        const entry = document.createElement("div");

        if (Boolean(condition) === true) {
            passed_assertions += 1;
            entry.className = "log-entry pass";
            entry.textContent = "[PASS] " + message;
            console.log("[PASS] " + message);
        } else {
            failed_assertions += 1;
            entry.className = "log-entry fail";
            entry.textContent = "[FAIL] " + message;
            console.error("[FAIL] " + message);
        }

        if (current_group_body !== null) {
            current_group_body.appendChild(entry);
        }
    }

    function assert_throws(fn, error_type, message) {
        try {
            fn();
            assert(
                false,
                message + " (Expected " + error_type.name + ")"
            );
        } catch (err) {
            if (err.constructor === error_type) {
                assert(
                    true,
                    message + " (Caught expected " + error_type.name + ")"
                );
            } else {
                assert(
                    false,
                    message + " (Caught unexpected error type)"
                );
            }
        }
    }

    function render_summary(start_time) {
        const elapsed = performance.now() - start_time;
        const duration = Math.round(elapsed * 100) / 100;
        let status_class = "summary-fail";

        if (failed_assertions === 0) {
            status_class = "summary-pass";
        }

        if (current_group_body !== null) {
            console.groupEnd();
        }

        const summary_text = (
            "Total Assertions: " +
            total_assertions +
            " | Passed: " +
            passed_assertions +
            " | Failed: " +
            failed_assertions +
            " | Execution Time: " +
            duration +
            " ms"
        );

        console.info(summary_text);

        summary_container.innerHTML = (
            "Total Assertions: <strong>" +
            total_assertions +
            "</strong> | Passed: <span class='" +
            status_class +
            "'>" +
            passed_assertions +
            "</span> | Failed: <span class='" +
            status_class +
            "'>" +
            failed_assertions +
            "</span> | Execution Time: <strong>" +
            duration +
            " ms</strong>"
        );
    }

    return Object.freeze({
        assert,
        assert_throws,
        group,
        render_summary
    });
}

// =============================================================================
// Test Suite Execution
// =============================================================================

function run_all_tests() {
    const runner = create_test_runner();
    const start_time = performance.now();

    // -------------------------------------------------------------------------
    // GROUP 1: Factory Instantiation & Parameter Validation
    // -------------------------------------------------------------------------
    runner.group("1. Factory Instantiation & Argument Guards");

    const valid_buffer = new ArrayBuffer(64);
    const valid_cursor = bytecursor(valid_buffer);

    runner.assert(
        valid_cursor !== undefined,
        "Valid ArrayBuffer instantiates successfully"
    );
    runner.assert(
        valid_cursor.length === 64,
        "Default view length equals buffer byteLength"
    );

    const offset_cursor = bytecursor(valid_buffer, 16, 32);
    runner.assert(
        offset_cursor.length === 32,
        "Explicit view_length sets length to 32"
    );

    runner.assert_throws(
        function () {
            bytecursor(null);
        },
        TypeError,
        "Null buffer throws TypeError"
    );

    runner.assert_throws(
        function () {
            bytecursor(undefined);
        },
        TypeError,
        "Undefined buffer throws TypeError"
    );

    runner.assert_throws(
        function () {
            bytecursor("not a buffer");
        },
        TypeError,
        "String buffer throws TypeError"
    );

    runner.assert_throws(
        function () {
            bytecursor([0, 1, 2]);
        },
        TypeError,
        "Array buffer throws TypeError"
    );

    runner.assert_throws(
        function () {
            bytecursor(new Uint8Array(16));
        },
        TypeError,
        "Uint8Array view passed as buffer throws TypeError"
    );

    runner.assert_throws(
        function () {
            bytecursor(valid_buffer, -1);
        },
        RangeError,
        "Negative view_offset throws RangeError"
    );

    runner.assert_throws(
        function () {
            bytecursor(valid_buffer, 1.5);
        },
        RangeError,
        "Non-integer view_offset throws RangeError"
    );

    runner.assert_throws(
        function () {
            bytecursor(valid_buffer, "0");
        },
        TypeError,
        "String view_offset throws TypeError"
    );

    runner.assert_throws(
        function () {
            bytecursor(valid_buffer, 100);
        },
        RangeError,
        "Out-of-bounds view_offset throws RangeError"
    );

    runner.assert_throws(
        function () {
            bytecursor(valid_buffer, 0, -5);
        },
        RangeError,
        "Negative view_length throws RangeError"
    );

    runner.assert_throws(
        function () {
            bytecursor(valid_buffer, 0, 10.5);
        },
        RangeError,
        "Non-integer view_length throws RangeError"
    );

    runner.assert_throws(
        function () {
            bytecursor(valid_buffer, 0, "32");
        },
        TypeError,
        "String view_length throws TypeError"
    );

    runner.assert_throws(
        function () {
            bytecursor(valid_buffer, 40, 30);
        },
        RangeError,
        "view_offset + view_length exceeding buffer throws RangeError"
    );

    // -------------------------------------------------------------------------
    // GROUP 2: Public Properties, Enumerability & Immutability
    // -------------------------------------------------------------------------
    runner.group("2. Object Properties & Immutability");

    const prop_buffer = new ArrayBuffer(16);
    const prop_cursor = bytecursor(prop_buffer);

    runner.assert(
        prop_cursor.buffer === prop_buffer,
        ".buffer property references underlying ArrayBuffer"
    );
    runner.assert(
        prop_cursor.length === 16,
        ".length property matches byte length"
    );
    runner.assert(
        is_data_view(prop_cursor.view),
        ".view property is a DataView"
    );

    runner.assert(
        Object.isFrozen(prop_cursor) === true,
        "Returned spec object is frozen with Object.freeze()"
    );
    runner.assert(
        prop_cursor.propertyIsEnumerable("buffer") === true,
        "buffer is enumerable"
    );
    runner.assert(
        prop_cursor.propertyIsEnumerable("length") === true,
        "length is enumerable"
    );
    runner.assert(
        prop_cursor.propertyIsEnumerable("view") === true,
        "view is enumerable"
    );

    runner.assert_throws(
        function () {
            prop_cursor.buffer = new ArrayBuffer(8);
        },
        TypeError,
        "Mutating .buffer property fails in strict mode"
    );

    runner.assert_throws(
        function () {
            prop_cursor.length = 999;
        },
        TypeError,
        "Mutating .length property fails in strict mode"
    );

    runner.assert_throws(
        function () {
            prop_cursor.rewind = function () {
                return undefined;
            };
        },
        TypeError,
        "Overwriting method fails in strict mode"
    );

    runner.assert_throws(
        function () {
            prop_cursor.newProp = 123;
        },
        TypeError,
        "Adding property to frozen spec object fails in strict mode"
    );

    runner.assert(
        prop_cursor.cursor === undefined,
        "Private internal cursor is fully encapsulated"
    );

    // -------------------------------------------------------------------------
    // GROUP 3: Cursor Navigation & Bounds Checks
    // -------------------------------------------------------------------------
    runner.group("3. Cursor Navigation & Bounds Checks");

    const nav_cursor = bytecursor(new ArrayBuffer(32));

    runner.assert(
        nav_cursor.tell() === 0,
        "Initial cursor position is 0"
    );
    runner.assert(
        nav_cursor.eof() === false,
        "eof() is false at start"
    );

    nav_cursor.seek(16);
    runner.assert(
        nav_cursor.tell() === 16,
        "seek(16) updates position to 16"
    );

    nav_cursor.skip(8);
    runner.assert(
        nav_cursor.tell() === 24,
        "skip(8) advances position to 24"
    );

    nav_cursor.skip(-4);
    runner.assert(
        nav_cursor.tell() === 20,
        "skip(-4) moves position back to 20"
    );

    nav_cursor.seek(32);
    runner.assert(
        nav_cursor.eof() === true,
        "eof() is true when cursor reaches byteLength"
    );

    nav_cursor.rewind();
    runner.assert(
        nav_cursor.tell() === 0,
        "rewind() resets cursor position to 0"
    );

    runner.assert_throws(
        function () {
            nav_cursor.seek(-1);
        },
        RangeError,
        "Negative seek throws RangeError"
    );

    runner.assert_throws(
        function () {
            nav_cursor.seek(33);
        },
        RangeError,
        "Seek past view bounds throws RangeError"
    );

    runner.assert_throws(
        function () {
            nav_cursor.seek("10");
        },
        TypeError,
        "String argument to seek throws TypeError"
    );

    runner.assert_throws(
        function () {
            nav_cursor.seek(10).skip(25);
        },
        RangeError,
        "Skip exceeding boundary throws RangeError"
    );

    runner.assert_throws(
        function () {
            nav_cursor.seek(10).skip(-15);
        },
        RangeError,
        "Skip below zero throws RangeError"
    );

    // -------------------------------------------------------------------------
    // GROUP 4: Integer Read/Write Operations & Boundaries
    // -------------------------------------------------------------------------
    runner.group("4. Integer Read/Write Operations & Boundaries");

    const int_cursor = bytecursor(new ArrayBuffer(32));

    int_cursor.writeUint8(0).writeUint8(255);
    int_cursor.writeInt8(-128).writeInt8(127);

    int_cursor.rewind();
    runner.assert(
        int_cursor.getUint8() === 0,
        "Uint8 min (0) verified"
    );
    runner.assert(
        int_cursor.getUint8() === 255,
        "Uint8 max (255) verified"
    );
    runner.assert(
        int_cursor.getInt8() === -128,
        "Int8 min (-128) verified"
    );
    runner.assert(
        int_cursor.getInt8() === 127,
        "Int8 max (127) verified"
    );

    int_cursor.rewind();
    int_cursor.writeUint16(65535, false);
    int_cursor.writeUint16(65535, true);
    int_cursor.writeInt16(-32768, false);
    int_cursor.writeInt16(32767, true);

    int_cursor.rewind();
    runner.assert(
        int_cursor.getUint16(false) === 65535,
        "Uint16 Big-Endian max verified"
    );
    runner.assert(
        int_cursor.getUint16(true) === 65535,
        "Uint16 Little-Endian max verified"
    );
    runner.assert(
        int_cursor.getInt16(false) === -32768,
        "Int16 Big-Endian min verified"
    );
    runner.assert(
        int_cursor.getInt16(true) === 32767,
        "Int16 Little-Endian max verified"
    );

    int_cursor.rewind();
    int_cursor.writeUint32(4294967295, true);
    int_cursor.writeInt32(-2147483648, false);

    int_cursor.rewind();
    runner.assert(
        int_cursor.getUint32(true) === 4294967295,
        "Uint32 max verified"
    );
    runner.assert(
        int_cursor.getInt32(false) === -2147483648,
        "Int32 min verified"
    );

    runner.assert_throws(
        function () {
            int_cursor.writeUint8(-1);
        },
        RangeError,
        "Uint8 below 0 throws RangeError"
    );

    runner.assert_throws(
        function () {
            int_cursor.writeUint8(256);
        },
        RangeError,
        "Uint8 above 255 throws RangeError"
    );

    runner.assert_throws(
        function () {
            int_cursor.writeUint8(1.5);
        },
        TypeError,
        "Non-integer Uint8 throws TypeError"
    );

    runner.assert_throws(
        function () {
            int_cursor.writeInt8(-129);
        },
        RangeError,
        "Int8 below -128 throws RangeError"
    );

    runner.assert_throws(
        function () {
            int_cursor.writeInt8(128);
        },
        RangeError,
        "Int8 above 127 throws RangeError"
    );

    runner.assert_throws(
        function () {
            int_cursor.writeUint16("60000");
        },
        TypeError,
        "String Uint16 throws TypeError"
    );

    runner.assert_throws(
        function () {
            int_cursor.writeUint32(4294967296);
        },
        RangeError,
        "Uint32 overflow throws RangeError"
    );

    // -------------------------------------------------------------------------
    // GROUP 5: Floating Point Operations
    // -------------------------------------------------------------------------
    runner.group("5. Floating Point Operations");

    const float_cursor = bytecursor(new ArrayBuffer(32));

    float_cursor.writeFloat32(3.1415927, true);
    float_cursor.writeFloat64(2.718281828459045, false);
    float_cursor.writeFloat32(NaN, true);
    float_cursor.writeFloat64(Infinity, false);

    float_cursor.rewind();
    const f32_diff = Math.abs(float_cursor.getFloat32(true) - 3.1415927);
    runner.assert(
        f32_diff < 0.00001,
        "Float32 roundtrip accurate"
    );
    runner.assert(
        float_cursor.getFloat64(false) === 2.718281828459045,
        "Float64 roundtrip accurate"
    );
    runner.assert(
        Number.isNaN(float_cursor.getFloat32(true)),
        "Float32 NaN handled correctly"
    );
    runner.assert(
        float_cursor.getFloat64(false) === Infinity,
        "Float64 Infinity handled correctly"
    );

    runner.assert_throws(
        function () {
            float_cursor.writeFloat32("3.14");
        },
        TypeError,
        "String value passed to writeFloat32 throws TypeError"
    );

    runner.assert_throws(
        function () {
            float_cursor.writeFloat64(null);
        },
        TypeError,
        "Null value passed to writeFloat64 throws TypeError"
    );

    // -------------------------------------------------------------------------
    // GROUP 6: Byte Array & Slice Operations
    // -------------------------------------------------------------------------
    runner.group("6. Byte Array & Slice Operations");

    const byte_cursor = bytecursor(new ArrayBuffer(16));
    const sample_bytes = new Uint8Array([10, 20, 30, 40, 50]);

    byte_cursor.writeBytes(sample_bytes);
    runner.assert(
        byte_cursor.tell() === 5,
        "writeBytes advanced cursor by byteLength (5)"
    );

    byte_cursor.rewind();
    const read_bytes = byte_cursor.getBytes(5);
    runner.assert(
        is_uint8_array(read_bytes),
        "getBytes returns Uint8Array"
    );
    runner.assert(
        read_bytes.length === 5,
        "getBytes length matches requested length"
    );
    runner.assert(
        read_bytes[0] === 10 && read_bytes[4] === 50,
        "getBytes content matches written data"
    );

    const sliced_buffer = byte_cursor.slice(0, 5);
    runner.assert(
        is_array_buffer(sliced_buffer),
        "slice() returns an ArrayBuffer"
    );
    runner.assert(
        sliced_buffer.byteLength === 5,
        "slice() length is 5"
    );

    runner.assert_throws(
        function () {
            byte_cursor.writeBytes([10, 20, 30]);
        },
        TypeError,
        "Passing plain Array to writeBytes throws TypeError"
    );

    runner.assert_throws(
        function () {
            byte_cursor.slice(5, 2);
        },
        RangeError,
        "slice() with start > end throws RangeError"
    );

    runner.assert_throws(
        function () {
            byte_cursor.slice(0, 100);
        },
        RangeError,
        "slice() with end > view.byteLength throws RangeError"
    );

    // -------------------------------------------------------------------------
    // GROUP 7: UTF-8 String Operations
    // -------------------------------------------------------------------------
    runner.group("7. UTF-8 String Operations");

    const str_cursor = bytecursor(new ArrayBuffer(64));
    const ascii_text = "Douglas Crockford";
    const unicode_text = "JavaScript 🚀 Good Parts";

    str_cursor.writeString(ascii_text);
    const ascii_len = str_cursor.tell();
    str_cursor.rewind();
    runner.assert(
        str_cursor.getString(ascii_len) === ascii_text,
        "ASCII string write/read verified"
    );

    str_cursor.rewind();
    str_cursor.writeString(unicode_text);
    const unicode_byte_len = str_cursor.tell();
    str_cursor.rewind();
    runner.assert(
        str_cursor.getString(unicode_byte_len) === unicode_text,
        "Multi-byte UTF-8 Unicode string write/read verified"
    );

    runner.assert_throws(
        function () {
            str_cursor.writeString(12345);
        },
        TypeError,
        "Number passed to writeString throws TypeError"
    );

    const small_cursor = bytecursor(new ArrayBuffer(5));
    runner.assert_throws(
        function () {
            small_cursor.writeString("Hello World!");
        },
        RangeError,
        "String exceeding remaining buffer view throws RangeError"
    );

    const unicode_small_cursor = bytecursor(new ArrayBuffer(2));
    runner.assert_throws(
        function () {
            unicode_small_cursor.writeString("🚀");
        },
        RangeError,
        "Multi-byte Unicode string exceeding buffer view throws RangeError"
    );

    // -------------------------------------------------------------------------
    // GROUP 8: Sub-view Isolation & Offset Mapping
    // -------------------------------------------------------------------------
    runner.group("8. Sub-view Isolation & Offset Mapping");

    const parent_buffer = new ArrayBuffer(64);

    new Uint8Array(parent_buffer).fill(255);

    const sub_cursor = bytecursor(parent_buffer, 16, 16);

    runner.assert(
        sub_cursor.length === 16,
        "Sub-view length is isolated to 16"
    );
    runner.assert(
        sub_cursor.tell() === 0,
        "Sub-view cursor starts at relative 0"
    );

    sub_cursor.writeUint32(0x12345678, true);

    const parent_bytes = new Uint8Array(parent_buffer);
    runner.assert(
        parent_bytes[0] === 255,
        "Byte 0 before view offset remains untouched (255)"
    );
    runner.assert(
        parent_bytes[15] === 255,
        "Byte 15 before view offset remains untouched (255)"
    );
    runner.assert(
        parent_bytes[16] === 0x78,
        "Byte 16 (relative offset 0) updated correctly"
    );
    runner.assert(
        parent_bytes[32] === 255,
        "Byte 32 after view offset remains untouched (255)"
    );

    runner.assert_throws(
        function () {
            sub_cursor.seek(16).writeUint8(1);
        },
        RangeError,
        "Writing past sub-view length (16) throws RangeError"
    );

    runner.render_summary(start_time);
}

run_all_tests();
