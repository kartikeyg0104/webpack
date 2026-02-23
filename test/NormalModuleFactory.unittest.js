"use strict";

const path = require("path");
const webpack = require("../lib/webpack");

describe("NormalModuleFactory", () => {
	describe("hooks.createModule error handling", () => {
		it("should propagate errors from createModule hook to the build", (done) => {
			const compiler = webpack({
				mode: "production",
				context: path.join(__dirname, "fixtures"),
				entry: "./a.js",
				output: {
					path: path.join(__dirname, "js", "NormalModuleFactory"),
					filename: "bundle.js"
				},
				plugins: [
					{
						apply(compiler) {
							compiler.hooks.compilation.tap(
								"TestPlugin",
								(compilation, { normalModuleFactory }) => {
									normalModuleFactory.hooks.createModule.tapAsync(
										"TestPlugin",
										(createData, resolveData, callback) => {
											callback(new Error("createModule hook error"));
										}
									);
								}
							);
						}
					}
				]
			});

			compiler.run((err, stats) => {
				if (err) {
					expect(err).toBeInstanceOf(Error);
					// The error should propagate - this is a valid outcome
					compiler.close(() => done());
					return;
				}
				// If stats are returned, the error should appear in compilation errors
				expect(stats.hasErrors()).toBe(true);
				const errors = stats.compilation.errors;
				expect(errors.length).toBeGreaterThan(0);
				const hasCreateModuleError = errors.some(
					(e) =>
						e.message.includes("createModule hook error") ||
						(e.error && e.error.message === "createModule hook error")
				);
				expect(hasCreateModuleError).toBe(true);
				compiler.close(() => done());
			});
		});

		it("should use createdModule from createModule hook when no error", (done) => {
			let createModuleHookCalled = false;
			const compiler = webpack({
				mode: "production",
				context: path.join(__dirname, "fixtures"),
				entry: "./a.js",
				output: {
					path: path.join(__dirname, "js", "NormalModuleFactory"),
					filename: "bundle.js"
				},
				plugins: [
					{
						apply(compiler) {
							compiler.hooks.compilation.tap(
								"TestPlugin",
								(compilation, { normalModuleFactory }) => {
									normalModuleFactory.hooks.createModule.tapAsync(
										"TestPlugin",
										(createData, resolveData, callback) => {
											createModuleHookCalled = true;
											// Return no error and no module - fallback to default
											callback(null);
										}
									);
								}
							);
						}
					}
				]
			});

			compiler.run((err, stats) => {
				expect(err).toBeFalsy();
				expect(createModuleHookCalled).toBe(true);
				compiler.close(() => done());
			});
		});
	});
});
