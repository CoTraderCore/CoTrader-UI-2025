// src/polyfills.js
import { Buffer } from 'buffer'
import process from 'process'

// Make Buffer and process available globally
window.global = window.global || window
window.Buffer = Buffer
window.process = process

// Also make them available as globals for modules that expect them
globalThis.Buffer = Buffer
globalThis.process = process