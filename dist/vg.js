(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.vg = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// rev 452
/********************************************************************************
*                                                                              *
* Author    :  Angus Johnson                                                   *
* Version   :  6.1.3a                                                          *
* Date      :  22 January 2014                                                 *
* Website   :  http://www.angusj.com                                           *
* Copyright :  Angus Johnson 2010-2014                                         *
*                                                                              *
* License:                                                                     *
* Use, modification & distribution is subject to Boost Software License Ver 1. *
* http://www.boost.org/LICENSE_1_0.txt                                         *
*                                                                              *
* Attributions:                                                                *
* The code in this library is an extension of Bala Vatti's clipping algorithm: *
* "A generic solution to polygon clipping"                                     *
* Communications of the ACM, Vol 35, Issue 7 (July 1992) pp 56-63.             *
* http://portal.acm.org/citation.cfm?id=129906                                 *
*                                                                              *
* Computer graphics and geometric modeling: implementation and algorithms      *
* By Max K. Agoston                                                            *
* Springer; 1 edition (January 4, 2005)                                        *
* http://books.google.com/books?q=vatti+clipping+agoston                       *
*                                                                              *
* See also:                                                                    *
* "Polygon Offsetting by Computing Winding Numbers"                            *
* Paper no. DETC2005-85513 pp. 565-575                                         *
* ASME 2005 International Design Engineering Technical Conferences             *
* and Computers and Information in Engineering Conference (IDETC/CIE2005)      *
* September 24-28, 2005 , Long Beach, California, USA                          *
* http://www.me.berkeley.edu/~mcmains/pubs/DAC05OffsetPolygon.pdf              *
*                                                                              *
*******************************************************************************/
/*******************************************************************************
*                                                                              *
* Author    :  Timo                                                            *
* Version   :  6.1.3.2                                                         *
* Date      :  1 February 2014                                                 *
*                                                                              *
* This is a translation of the C# Clipper library to Javascript.               *
* Int128 struct of C# is implemented using JSBN of Tom Wu.                     *
* Because Javascript lacks support for 64-bit integers, the space              *
* is a little more restricted than in C# version.                              *
*                                                                              *
* C# version has support for coordinate space:                                 *
* +-4611686018427387903 ( sqrt(2^127 -1)/2 )                                   *
* while Javascript version has support for space:                              *
* +-4503599627370495 ( sqrt(2^106 -1)/2 )                                      *
*                                                                              *
* Tom Wu's JSBN proved to be the fastest big integer library:                  *
* http://jsperf.com/big-integer-library-test                                   *
*                                                                              *
* This class can be made simpler when (if ever) 64-bit integer support comes.  *
*                                                                              *
*******************************************************************************/
/*******************************************************************************
*                                                                              *
* Basic JavaScript BN library - subset useful for RSA encryption.              *
* http://www-cs-students.stanford.edu/~tjw/jsbn/                               *
* Copyright (c) 2005  Tom Wu                                                   *
* All Rights Reserved.                                                         *
* See "LICENSE" for details:                                                   *
* http://www-cs-students.stanford.edu/~tjw/jsbn/LICENSE                        *
*                                                                              *
*******************************************************************************/

"use strict";
//use_int32: When enabled 32bit ints are used instead of 64bit ints. This
//improve performance but coordinate values are limited to the range +/- 46340
var use_int32 = false;
//use_xyz: adds a Z member to IntPoint. Adds a minor cost to performance.
var use_xyz = false;
//UseLines: Enables line clipping. Adds a very minor cost to performance.
var use_lines = true;
//use_deprecated: Enables support for the obsolete OffsetPaths() function
//which has been replace with the ClipperOffset class.
var use_deprecated = false;

var ClipperLib = {};
var isNode = false;
if (typeof module !== 'undefined' && module.exports)
{
  module.exports = ClipperLib;
  isNode = true;
}
else
{
  if (typeof (document) !== "undefined") window.ClipperLib = ClipperLib;
  else self['ClipperLib'] = ClipperLib;
}
var navigator_appName;
if (!isNode)
{
  var nav = navigator.userAgent.toString().toLowerCase();
  navigator_appName = navigator.appName;
}
else
{
  var nav = "chrome"; // Node.js uses Chrome's V8 engine
  navigator_appName = "Netscape"; // Firefox, Chrome and Safari returns "Netscape", so Node.js should also
}
// Browser test to speedup performance critical functions
var browser = {};
if (nav.indexOf("chrome") != -1 && nav.indexOf("chromium") == -1) browser.chrome = 1;
else browser.chrome = 0;
if (nav.indexOf("chromium") != -1) browser.chromium = 1;
else browser.chromium = 0;
if (nav.indexOf("safari") != -1 && nav.indexOf("chrome") == -1 && nav.indexOf("chromium") == -1) browser.safari = 1;
else browser.safari = 0;
if (nav.indexOf("firefox") != -1) browser.firefox = 1;
else browser.firefox = 0;
if (nav.indexOf("firefox/17") != -1) browser.firefox17 = 1;
else browser.firefox17 = 0;
if (nav.indexOf("firefox/15") != -1) browser.firefox15 = 1;
else browser.firefox15 = 0;
if (nav.indexOf("firefox/3") != -1) browser.firefox3 = 1;
else browser.firefox3 = 0;
if (nav.indexOf("opera") != -1) browser.opera = 1;
else browser.opera = 0;
if (nav.indexOf("msie 10") != -1) browser.msie10 = 1;
else browser.msie10 = 0;
if (nav.indexOf("msie 9") != -1) browser.msie9 = 1;
else browser.msie9 = 0;
if (nav.indexOf("msie 8") != -1) browser.msie8 = 1;
else browser.msie8 = 0;
if (nav.indexOf("msie 7") != -1) browser.msie7 = 1;
else browser.msie7 = 0;
if (nav.indexOf("msie ") != -1) browser.msie = 1;
else browser.msie = 0;
ClipperLib.biginteger_used = null;
// Copyright (c) 2005  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.
// Basic JavaScript BN library - subset useful for RSA encryption.
// Bits per digit
var dbits;
// JavaScript engine analysis
var canary = 0xdeadbeefcafe;
var j_lm = ((canary & 0xffffff) == 0xefcafe);
// (public) Constructor
function BigInteger(a, b, c)
{
  // This test variable can be removed,
  // but at least for performance tests it is useful piece of knowledge
  // This is the only ClipperLib related variable in BigInteger library
  ClipperLib.biginteger_used = 1;
  if (a != null)
    if ("number" == typeof a && "undefined" == typeof (b)) this.fromInt(a); // faster conversion
    else if ("number" == typeof a) this.fromNumber(a, b, c);
  else if (b == null && "string" != typeof a) this.fromString(a, 256);
  else this.fromString(a, b);
}
// return new, unset BigInteger
function nbi()
{
  return new BigInteger(null);
}
// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.
// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i, x, w, j, c, n)
{
  while (--n >= 0)
  {
    var v = x * this[i++] + w[j] + c;
    c = Math.floor(v / 0x4000000);
    w[j++] = v & 0x3ffffff;
  }
  return c;
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i, x, w, j, c, n)
{
  var xl = x & 0x7fff,
    xh = x >> 15;
  while (--n >= 0)
  {
    var l = this[i] & 0x7fff;
    var h = this[i++] >> 15;
    var m = xh * l + h * xl;
    l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
    c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
    w[j++] = l & 0x3fffffff;
  }
  return c;
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i, x, w, j, c, n)
{
  var xl = x & 0x3fff,
    xh = x >> 14;
  while (--n >= 0)
  {
    var l = this[i] & 0x3fff;
    var h = this[i++] >> 14;
    var m = xh * l + h * xl;
    l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
    c = (l >> 28) + (m >> 14) + xh * h;
    w[j++] = l & 0xfffffff;
  }
  return c;
}
if (j_lm && (navigator_appName == "Microsoft Internet Explorer"))
{
  BigInteger.prototype.am = am2;
  dbits = 30;
}
else if (j_lm && (navigator_appName != "Netscape"))
{
  BigInteger.prototype.am = am1;
  dbits = 26;
}
else
{ // Mozilla/Netscape seems to prefer am3
  BigInteger.prototype.am = am3;
  dbits = 28;
}
BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = ((1 << dbits) - 1);
BigInteger.prototype.DV = (1 << dbits);
var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2, BI_FP);
BigInteger.prototype.F1 = BI_FP - dbits;
BigInteger.prototype.F2 = 2 * dbits - BI_FP;
// Digit conversions
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr, vv;
rr = "0".charCodeAt(0);
for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

function int2char(n)
{
  return BI_RM.charAt(n);
}

function intAt(s, i)
{
  var c = BI_RC[s.charCodeAt(i)];
  return (c == null) ? -1 : c;
}
// (protected) copy this to r
function bnpCopyTo(r)
{
  for (var i = this.t - 1; i >= 0; --i) r[i] = this[i];
  r.t = this.t;
  r.s = this.s;
}
// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x)
{
  this.t = 1;
  this.s = (x < 0) ? -1 : 0;
  if (x > 0) this[0] = x;
  else if (x < -1) this[0] = x + this.DV;
  else this.t = 0;
}
// return bigint initialized to value
function nbv(i)
{
  var r = nbi();
  r.fromInt(i);
  return r;
}
// (protected) set from string and radix
function bnpFromString(s, b)
{
  var k;
  if (b == 16) k = 4;
  else if (b == 8) k = 3;
  else if (b == 256) k = 8; // byte array
  else if (b == 2) k = 1;
  else if (b == 32) k = 5;
  else if (b == 4) k = 2;
  else
  {
    this.fromRadix(s, b);
    return;
  }
  this.t = 0;
  this.s = 0;
  var i = s.length,
    mi = false,
    sh = 0;
  while (--i >= 0)
  {
    var x = (k == 8) ? s[i] & 0xff : intAt(s, i);
    if (x < 0)
    {
      if (s.charAt(i) == "-") mi = true;
      continue;
    }
    mi = false;
    if (sh == 0)
      this[this.t++] = x;
    else if (sh + k > this.DB)
    {
      this[this.t - 1] |= (x & ((1 << (this.DB - sh)) - 1)) << sh;
      this[this.t++] = (x >> (this.DB - sh));
    }
    else
      this[this.t - 1] |= x << sh;
    sh += k;
    if (sh >= this.DB) sh -= this.DB;
  }
  if (k == 8 && (s[0] & 0x80) != 0)
  {
    this.s = -1;
    if (sh > 0) this[this.t - 1] |= ((1 << (this.DB - sh)) - 1) << sh;
  }
  this.clamp();
  if (mi) BigInteger.ZERO.subTo(this, this);
}
// (protected) clamp off excess high words
function bnpClamp()
{
  var c = this.s & this.DM;
  while (this.t > 0 && this[this.t - 1] == c)--this.t;
}
// (public) return string representation in given radix
function bnToString(b)
{
  if (this.s < 0) return "-" + this.negate().toString(b);
  var k;
  if (b == 16) k = 4;
  else if (b == 8) k = 3;
  else if (b == 2) k = 1;
  else if (b == 32) k = 5;
  else if (b == 4) k = 2;
  else return this.toRadix(b);
  var km = (1 << k) - 1,
    d, m = false,
    r = "",
    i = this.t;
  var p = this.DB - (i * this.DB) % k;
  if (i-- > 0)
  {
    if (p < this.DB && (d = this[i] >> p) > 0)
    {
      m = true;
      r = int2char(d);
    }
    while (i >= 0)
    {
      if (p < k)
      {
        d = (this[i] & ((1 << p) - 1)) << (k - p);
        d |= this[--i] >> (p += this.DB - k);
      }
      else
      {
        d = (this[i] >> (p -= k)) & km;
        if (p <= 0)
        {
          p += this.DB;
          --i;
        }
      }
      if (d > 0) m = true;
      if (m) r += int2char(d);
    }
  }
  return m ? r : "0";
}
// (public) -this
function bnNegate()
{
  var r = nbi();
  BigInteger.ZERO.subTo(this, r);
  return r;
}
// (public) |this|
function bnAbs()
{
  return (this.s < 0) ? this.negate() : this;
}
// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a)
{
  var r = this.s - a.s;
  if (r != 0) return r;
  var i = this.t;
  r = i - a.t;
  if (r != 0) return (this.s < 0) ? -r : r;
  while (--i >= 0)
    if ((r = this[i] - a[i]) != 0) return r;
  return 0;
}
// returns bit length of the integer x
function nbits(x)
{
  var r = 1,
    t;
  if ((t = x >>> 16) != 0)
  {
    x = t;
    r += 16;
  }
  if ((t = x >> 8) != 0)
  {
    x = t;
    r += 8;
  }
  if ((t = x >> 4) != 0)
  {
    x = t;
    r += 4;
  }
  if ((t = x >> 2) != 0)
  {
    x = t;
    r += 2;
  }
  if ((t = x >> 1) != 0)
  {
    x = t;
    r += 1;
  }
  return r;
}
// (public) return the number of bits in "this"
function bnBitLength()
{
  if (this.t <= 0) return 0;
  return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ (this.s & this.DM));
}
// (protected) r = this << n*DB
function bnpDLShiftTo(n, r)
{
  var i;
  for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i];
  for (i = n - 1; i >= 0; --i) r[i] = 0;
  r.t = this.t + n;
  r.s = this.s;
}
// (protected) r = this >> n*DB
function bnpDRShiftTo(n, r)
{
  for (var i = n; i < this.t; ++i) r[i - n] = this[i];
  r.t = Math.max(this.t - n, 0);
  r.s = this.s;
}
// (protected) r = this << n
function bnpLShiftTo(n, r)
{
  var bs = n % this.DB;
  var cbs = this.DB - bs;
  var bm = (1 << cbs) - 1;
  var ds = Math.floor(n / this.DB),
    c = (this.s << bs) & this.DM,
    i;
  for (i = this.t - 1; i >= 0; --i)
  {
    r[i + ds + 1] = (this[i] >> cbs) | c;
    c = (this[i] & bm) << bs;
  }
  for (i = ds - 1; i >= 0; --i) r[i] = 0;
  r[ds] = c;
  r.t = this.t + ds + 1;
  r.s = this.s;
  r.clamp();
}
// (protected) r = this >> n
function bnpRShiftTo(n, r)
{
  r.s = this.s;
  var ds = Math.floor(n / this.DB);
  if (ds >= this.t)
  {
    r.t = 0;
    return;
  }
  var bs = n % this.DB;
  var cbs = this.DB - bs;
  var bm = (1 << bs) - 1;
  r[0] = this[ds] >> bs;
  for (var i = ds + 1; i < this.t; ++i)
  {
    r[i - ds - 1] |= (this[i] & bm) << cbs;
    r[i - ds] = this[i] >> bs;
  }
  if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
  r.t = this.t - ds;
  r.clamp();
}
// (protected) r = this - a
function bnpSubTo(a, r)
{
  var i = 0,
    c = 0,
    m = Math.min(a.t, this.t);
  while (i < m)
  {
    c += this[i] - a[i];
    r[i++] = c & this.DM;
    c >>= this.DB;
  }
  if (a.t < this.t)
  {
    c -= a.s;
    while (i < this.t)
    {
      c += this[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }
    c += this.s;
  }
  else
  {
    c += this.s;
    while (i < a.t)
    {
      c -= a[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }
    c -= a.s;
  }
  r.s = (c < 0) ? -1 : 0;
  if (c < -1) r[i++] = this.DV + c;
  else if (c > 0) r[i++] = c;
  r.t = i;
  r.clamp();
}
// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
function bnpMultiplyTo(a, r)
{
  var x = this.abs(),
    y = a.abs();
  var i = x.t;
  r.t = i + y.t;
  while (--i >= 0) r[i] = 0;
  for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
  r.s = 0;
  r.clamp();
  if (this.s != a.s) BigInteger.ZERO.subTo(r, r);
}
// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r)
{
  var x = this.abs();
  var i = r.t = 2 * x.t;
  while (--i >= 0) r[i] = 0;
  for (i = 0; i < x.t - 1; ++i)
  {
    var c = x.am(i, x[i], r, 2 * i, 0, 1);
    if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV)
    {
      r[i + x.t] -= x.DV;
      r[i + x.t + 1] = 1;
    }
  }
  if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
  r.s = 0;
  r.clamp();
}
// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m, q, r)
{
  var pm = m.abs();
  if (pm.t <= 0) return;
  var pt = this.abs();
  if (pt.t < pm.t)
  {
    if (q != null) q.fromInt(0);
    if (r != null) this.copyTo(r);
    return;
  }
  if (r == null) r = nbi();
  var y = nbi(),
    ts = this.s,
    ms = m.s;
  var nsh = this.DB - nbits(pm[pm.t - 1]); // normalize modulus
  if (nsh > 0)
  {
    pm.lShiftTo(nsh, y);
    pt.lShiftTo(nsh, r);
  }
  else
  {
    pm.copyTo(y);
    pt.copyTo(r);
  }
  var ys = y.t;
  var y0 = y[ys - 1];
  if (y0 == 0) return;
  var yt = y0 * (1 << this.F1) + ((ys > 1) ? y[ys - 2] >> this.F2 : 0);
  var d1 = this.FV / yt,
    d2 = (1 << this.F1) / yt,
    e = 1 << this.F2;
  var i = r.t,
    j = i - ys,
    t = (q == null) ? nbi() : q;
  y.dlShiftTo(j, t);
  if (r.compareTo(t) >= 0)
  {
    r[r.t++] = 1;
    r.subTo(t, r);
  }
  BigInteger.ONE.dlShiftTo(ys, t);
  t.subTo(y, y); // "negative" y so we can replace sub with am later
  while (y.t < ys) y[y.t++] = 0;
  while (--j >= 0)
  {
    // Estimate quotient digit
    var qd = (r[--i] == y0) ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
    if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd)
    { // Try it out
      y.dlShiftTo(j, t);
      r.subTo(t, r);
      while (r[i] < --qd) r.subTo(t, r);
    }
  }
  if (q != null)
  {
    r.drShiftTo(ys, q);
    if (ts != ms) BigInteger.ZERO.subTo(q, q);
  }
  r.t = ys;
  r.clamp();
  if (nsh > 0) r.rShiftTo(nsh, r); // Denormalize remainder
  if (ts < 0) BigInteger.ZERO.subTo(r, r);
}
// (public) this mod a
function bnMod(a)
{
  var r = nbi();
  this.abs().divRemTo(a, null, r);
  if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r);
  return r;
}
// Modular reduction using "classic" algorithm
function Classic(m)
{
  this.m = m;
}

function cConvert(x)
{
  if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
  else return x;
}

function cRevert(x)
{
  return x;
}

function cReduce(x)
{
  x.divRemTo(this.m, null, x);
}

function cMulTo(x, y, r)
{
  x.multiplyTo(y, r);
  this.reduce(r);
}

function cSqrTo(x, r)
{
  x.squareTo(r);
  this.reduce(r);
}
Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;
// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
function bnpInvDigit()
{
  if (this.t < 1) return 0;
  var x = this[0];
  if ((x & 1) == 0) return 0;
  var y = x & 3; // y == 1/x mod 2^2
  y = (y * (2 - (x & 0xf) * y)) & 0xf; // y == 1/x mod 2^4
  y = (y * (2 - (x & 0xff) * y)) & 0xff; // y == 1/x mod 2^8
  y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff; // y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
  y = (y * (2 - x * y % this.DV)) % this.DV; // y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y > 0) ? this.DV - y : -y;
}
// Montgomery reduction
function Montgomery(m)
{
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp & 0x7fff;
  this.mph = this.mp >> 15;
  this.um = (1 << (m.DB - 15)) - 1;
  this.mt2 = 2 * m.t;
}
// xR mod m
function montConvert(x)
{
  var r = nbi();
  x.abs().dlShiftTo(this.m.t, r);
  r.divRemTo(this.m, null, r);
  if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r);
  return r;
}
// x/R mod m
function montRevert(x)
{
  var r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
}
// x = x/R mod m (HAC 14.32)
function montReduce(x)
{
  while (x.t <= this.mt2) // pad x so am has enough room later
    x[x.t++] = 0;
  for (var i = 0; i < this.m.t; ++i)
  {
    // faster way of calculating u0 = x[i]*mp mod DV
    var j = x[i] & 0x7fff;
    var u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM;
    // use am to combine the multiply-shift-add into one call
    j = i + this.m.t;
    x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
    // propagate carry
    while (x[j] >= x.DV)
    {
      x[j] -= x.DV;
      x[++j]++;
    }
  }
  x.clamp();
  x.drShiftTo(this.m.t, x);
  if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
}
// r = "x^2/R mod m"; x != r
function montSqrTo(x, r)
{
  x.squareTo(r);
  this.reduce(r);
}
// r = "xy/R mod m"; x,y != r
function montMulTo(x, y, r)
{
  x.multiplyTo(y, r);
  this.reduce(r);
}
Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;
// (protected) true iff this is even
function bnpIsEven()
{
  return ((this.t > 0) ? (this[0] & 1) : this.s) == 0;
}
// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
function bnpExp(e, z)
{
  if (e > 0xffffffff || e < 1) return BigInteger.ONE;
  var r = nbi(),
    r2 = nbi(),
    g = z.convert(this),
    i = nbits(e) - 1;
  g.copyTo(r);
  while (--i >= 0)
  {
    z.sqrTo(r, r2);
    if ((e & (1 << i)) > 0) z.mulTo(r2, g, r);
    else
    {
      var t = r;
      r = r2;
      r2 = t;
    }
  }
  return z.revert(r);
}
// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e, m)
{
  var z;
  if (e < 256 || m.isEven()) z = new Classic(m);
  else z = new Montgomery(m);
  return this.exp(e, z);
}
// protected
BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.isEven = bnpIsEven;
BigInteger.prototype.exp = bnpExp;
// public
BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.modPowInt = bnModPowInt;
// "constants"
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);
// Copyright (c) 2005-2009  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.
// Extended JavaScript BN functions, required for RSA private ops.
// Version 1.1: new BigInteger("0", 10) returns "proper" zero
// Version 1.2: square() API, isProbablePrime fix
// (public)
function bnClone()
{
  var r = nbi();
  this.copyTo(r);
  return r;
}
// (public) return value as integer
function bnIntValue()
{
  if (this.s < 0)
  {
    if (this.t == 1) return this[0] - this.DV;
    else if (this.t == 0) return -1;
  }
  else if (this.t == 1) return this[0];
  else if (this.t == 0) return 0;
  // assumes 16 < DB < 32
  return ((this[1] & ((1 << (32 - this.DB)) - 1)) << this.DB) | this[0];
}
// (public) return value as byte
function bnByteValue()
{
  return (this.t == 0) ? this.s : (this[0] << 24) >> 24;
}
// (public) return value as short (assumes DB>=16)
function bnShortValue()
{
  return (this.t == 0) ? this.s : (this[0] << 16) >> 16;
}
// (protected) return x s.t. r^x < DV
function bnpChunkSize(r)
{
  return Math.floor(Math.LN2 * this.DB / Math.log(r));
}
// (public) 0 if this == 0, 1 if this > 0
function bnSigNum()
{
  if (this.s < 0) return -1;
  else if (this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
  else return 1;
}
// (protected) convert to radix string
function bnpToRadix(b)
{
  if (b == null) b = 10;
  if (this.signum() == 0 || b < 2 || b > 36) return "0";
  var cs = this.chunkSize(b);
  var a = Math.pow(b, cs);
  var d = nbv(a),
    y = nbi(),
    z = nbi(),
    r = "";
  this.divRemTo(d, y, z);
  while (y.signum() > 0)
  {
    r = (a + z.intValue()).toString(b).substr(1) + r;
    y.divRemTo(d, y, z);
  }
  return z.intValue().toString(b) + r;
}
// (protected) convert from radix string
function bnpFromRadix(s, b)
{
  this.fromInt(0);
  if (b == null) b = 10;
  var cs = this.chunkSize(b);
  var d = Math.pow(b, cs),
    mi = false,
    j = 0,
    w = 0;
  for (var i = 0; i < s.length; ++i)
  {
    var x = intAt(s, i);
    if (x < 0)
    {
      if (s.charAt(i) == "-" && this.signum() == 0) mi = true;
      continue;
    }
    w = b * w + x;
    if (++j >= cs)
    {
      this.dMultiply(d);
      this.dAddOffset(w, 0);
      j = 0;
      w = 0;
    }
  }
  if (j > 0)
  {
    this.dMultiply(Math.pow(b, j));
    this.dAddOffset(w, 0);
  }
  if (mi) BigInteger.ZERO.subTo(this, this);
}
// (protected) alternate constructor
function bnpFromNumber(a, b, c)
{
  if ("number" == typeof b)
  {
    // new BigInteger(int,int,RNG)
    if (a < 2) this.fromInt(1);
    else
    {
      this.fromNumber(a, c);
      if (!this.testBit(a - 1)) // force MSB set
        this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
      if (this.isEven()) this.dAddOffset(1, 0); // force odd
      while (!this.isProbablePrime(b))
      {
        this.dAddOffset(2, 0);
        if (this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
      }
    }
  }
  else
  {
    // new BigInteger(int,RNG)
    var x = new Array(),
      t = a & 7;
    x.length = (a >> 3) + 1;
    b.nextBytes(x);
    if (t > 0) x[0] &= ((1 << t) - 1);
    else x[0] = 0;
    this.fromString(x, 256);
  }
}
// (public) convert to bigendian byte array
function bnToByteArray()
{
  var i = this.t,
    r = new Array();
  r[0] = this.s;
  var p = this.DB - (i * this.DB) % 8,
    d, k = 0;
  if (i-- > 0)
  {
    if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p)
      r[k++] = d | (this.s << (this.DB - p));
    while (i >= 0)
    {
      if (p < 8)
      {
        d = (this[i] & ((1 << p) - 1)) << (8 - p);
        d |= this[--i] >> (p += this.DB - 8);
      }
      else
      {
        d = (this[i] >> (p -= 8)) & 0xff;
        if (p <= 0)
        {
          p += this.DB;
          --i;
        }
      }
      if ((d & 0x80) != 0) d |= -256;
      if (k == 0 && (this.s & 0x80) != (d & 0x80))++k;
      if (k > 0 || d != this.s) r[k++] = d;
    }
  }
  return r;
}

function bnEquals(a)
{
  return (this.compareTo(a) == 0);
}

function bnMin(a)
{
  return (this.compareTo(a) < 0) ? this : a;
}

function bnMax(a)
{
  return (this.compareTo(a) > 0) ? this : a;
}
// (protected) r = this op a (bitwise)
function bnpBitwiseTo(a, op, r)
{
  var i, f, m = Math.min(a.t, this.t);
  for (i = 0; i < m; ++i) r[i] = op(this[i], a[i]);
  if (a.t < this.t)
  {
    f = a.s & this.DM;
    for (i = m; i < this.t; ++i) r[i] = op(this[i], f);
    r.t = this.t;
  }
  else
  {
    f = this.s & this.DM;
    for (i = m; i < a.t; ++i) r[i] = op(f, a[i]);
    r.t = a.t;
  }
  r.s = op(this.s, a.s);
  r.clamp();
}
// (public) this & a
function op_and(x, y)
{
  return x & y;
}

function bnAnd(a)
{
  var r = nbi();
  this.bitwiseTo(a, op_and, r);
  return r;
}
// (public) this | a
function op_or(x, y)
{
  return x | y;
}

function bnOr(a)
{
  var r = nbi();
  this.bitwiseTo(a, op_or, r);
  return r;
}
// (public) this ^ a
function op_xor(x, y)
{
  return x ^ y;
}

function bnXor(a)
{
  var r = nbi();
  this.bitwiseTo(a, op_xor, r);
  return r;
}
// (public) this & ~a
function op_andnot(x, y)
{
  return x & ~y;
}

function bnAndNot(a)
{
  var r = nbi();
  this.bitwiseTo(a, op_andnot, r);
  return r;
}
// (public) ~this
function bnNot()
{
  var r = nbi();
  for (var i = 0; i < this.t; ++i) r[i] = this.DM & ~this[i];
  r.t = this.t;
  r.s = ~this.s;
  return r;
}
// (public) this << n
function bnShiftLeft(n)
{
  var r = nbi();
  if (n < 0) this.rShiftTo(-n, r);
  else this.lShiftTo(n, r);
  return r;
}
// (public) this >> n
function bnShiftRight(n)
{
  var r = nbi();
  if (n < 0) this.lShiftTo(-n, r);
  else this.rShiftTo(n, r);
  return r;
}
// return index of lowest 1-bit in x, x < 2^31
function lbit(x)
{
  if (x == 0) return -1;
  var r = 0;
  if ((x & 0xffff) == 0)
  {
    x >>= 16;
    r += 16;
  }
  if ((x & 0xff) == 0)
  {
    x >>= 8;
    r += 8;
  }
  if ((x & 0xf) == 0)
  {
    x >>= 4;
    r += 4;
  }
  if ((x & 3) == 0)
  {
    x >>= 2;
    r += 2;
  }
  if ((x & 1) == 0)++r;
  return r;
}
// (public) returns index of lowest 1-bit (or -1 if none)
function bnGetLowestSetBit()
{
  for (var i = 0; i < this.t; ++i)
    if (this[i] != 0) return i * this.DB + lbit(this[i]);
  if (this.s < 0) return this.t * this.DB;
  return -1;
}
// return number of 1 bits in x
function cbit(x)
{
  var r = 0;
  while (x != 0)
  {
    x &= x - 1;
    ++r;
  }
  return r;
}
// (public) return number of set bits
function bnBitCount()
{
  var r = 0,
    x = this.s & this.DM;
  for (var i = 0; i < this.t; ++i) r += cbit(this[i] ^ x);
  return r;
}
// (public) true iff nth bit is set
function bnTestBit(n)
{
  var j = Math.floor(n / this.DB);
  if (j >= this.t) return (this.s != 0);
  return ((this[j] & (1 << (n % this.DB))) != 0);
}
// (protected) this op (1<<n)
function bnpChangeBit(n, op)
{
  var r = BigInteger.ONE.shiftLeft(n);
  this.bitwiseTo(r, op, r);
  return r;
}
// (public) this | (1<<n)
function bnSetBit(n)
{
  return this.changeBit(n, op_or);
}
// (public) this & ~(1<<n)
function bnClearBit(n)
{
  return this.changeBit(n, op_andnot);
}
// (public) this ^ (1<<n)
function bnFlipBit(n)
{
  return this.changeBit(n, op_xor);
}
// (protected) r = this + a
function bnpAddTo(a, r)
{
  var i = 0,
    c = 0,
    m = Math.min(a.t, this.t);
  while (i < m)
  {
    c += this[i] + a[i];
    r[i++] = c & this.DM;
    c >>= this.DB;
  }
  if (a.t < this.t)
  {
    c += a.s;
    while (i < this.t)
    {
      c += this[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }
    c += this.s;
  }
  else
  {
    c += this.s;
    while (i < a.t)
    {
      c += a[i];
      r[i++] = c & this.DM;
      c >>= this.DB;
    }
    c += a.s;
  }
  r.s = (c < 0) ? -1 : 0;
  if (c > 0) r[i++] = c;
  else if (c < -1) r[i++] = this.DV + c;
  r.t = i;
  r.clamp();
}
// (public) this + a
function bnAdd(a)
{
  var r = nbi();
  this.addTo(a, r);
  return r;
}
// (public) this - a
function bnSubtract(a)
{
  var r = nbi();
  this.subTo(a, r);
  return r;
}
// (public) this * a
function bnMultiply(a)
{
  var r = nbi();
  this.multiplyTo(a, r);
  return r;
}
// (public) this^2
function bnSquare()
{
  var r = nbi();
  this.squareTo(r);
  return r;
}
// (public) this / a
function bnDivide(a)
{
  var r = nbi();
  this.divRemTo(a, r, null);
  return r;
}
// (public) this % a
function bnRemainder(a)
{
  var r = nbi();
  this.divRemTo(a, null, r);
  return r;
}
// (public) [this/a,this%a]
function bnDivideAndRemainder(a)
{
  var q = nbi(),
    r = nbi();
  this.divRemTo(a, q, r);
  return new Array(q, r);
}
// (protected) this *= n, this >= 0, 1 < n < DV
function bnpDMultiply(n)
{
  this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
  ++this.t;
  this.clamp();
}
// (protected) this += n << w words, this >= 0
function bnpDAddOffset(n, w)
{
  if (n == 0) return;
  while (this.t <= w) this[this.t++] = 0;
  this[w] += n;
  while (this[w] >= this.DV)
  {
    this[w] -= this.DV;
    if (++w >= this.t) this[this.t++] = 0;
    ++this[w];
  }
}
// A "null" reducer
function NullExp()
{}

function nNop(x)
{
  return x;
}

function nMulTo(x, y, r)
{
  x.multiplyTo(y, r);
}

function nSqrTo(x, r)
{
  x.squareTo(r);
}
NullExp.prototype.convert = nNop;
NullExp.prototype.revert = nNop;
NullExp.prototype.mulTo = nMulTo;
NullExp.prototype.sqrTo = nSqrTo;
// (public) this^e
function bnPow(e)
{
  return this.exp(e, new NullExp());
}
// (protected) r = lower n words of "this * a", a.t <= n
// "this" should be the larger one if appropriate.
function bnpMultiplyLowerTo(a, n, r)
{
  var i = Math.min(this.t + a.t, n);
  r.s = 0; // assumes a,this >= 0
  r.t = i;
  while (i > 0) r[--i] = 0;
  var j;
  for (j = r.t - this.t; i < j; ++i) r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
  for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r, i, 0, n - i);
  r.clamp();
}
// (protected) r = "this * a" without lower n words, n > 0
// "this" should be the larger one if appropriate.
function bnpMultiplyUpperTo(a, n, r)
{
  --n;
  var i = r.t = this.t + a.t - n;
  r.s = 0; // assumes a,this >= 0
  while (--i >= 0) r[i] = 0;
  for (i = Math.max(n - this.t, 0); i < a.t; ++i)
    r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
  r.clamp();
  r.drShiftTo(1, r);
}
// Barrett modular reduction
function Barrett(m)
{
  // setup Barrett
  this.r2 = nbi();
  this.q3 = nbi();
  BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
  this.mu = this.r2.divide(m);
  this.m = m;
}

function barrettConvert(x)
{
  if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m);
  else if (x.compareTo(this.m) < 0) return x;
  else
  {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
}

function barrettRevert(x)
{
  return x;
}
// x = x mod m (HAC 14.42)
function barrettReduce(x)
{
  x.drShiftTo(this.m.t - 1, this.r2);
  if (x.t > this.m.t + 1)
  {
    x.t = this.m.t + 1;
    x.clamp();
  }
  this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
  this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
  while (x.compareTo(this.r2) < 0) x.dAddOffset(1, this.m.t + 1);
  x.subTo(this.r2, x);
  while (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
}
// r = x^2 mod m; x != r
function barrettSqrTo(x, r)
{
  x.squareTo(r);
  this.reduce(r);
}
// r = x*y mod m; x,y != r
function barrettMulTo(x, y, r)
{
  x.multiplyTo(y, r);
  this.reduce(r);
}
Barrett.prototype.convert = barrettConvert;
Barrett.prototype.revert = barrettRevert;
Barrett.prototype.reduce = barrettReduce;
Barrett.prototype.mulTo = barrettMulTo;
Barrett.prototype.sqrTo = barrettSqrTo;
// (public) this^e % m (HAC 14.85)
function bnModPow(e, m)
{
  var i = e.bitLength(),
    k, r = nbv(1),
    z;
  if (i <= 0) return r;
  else if (i < 18) k = 1;
  else if (i < 48) k = 3;
  else if (i < 144) k = 4;
  else if (i < 768) k = 5;
  else k = 6;
  if (i < 8)
    z = new Classic(m);
  else if (m.isEven())
    z = new Barrett(m);
  else
    z = new Montgomery(m);
  // precomputation
  var g = new Array(),
    n = 3,
    k1 = k - 1,
    km = (1 << k) - 1;
  g[1] = z.convert(this);
  if (k > 1)
  {
    var g2 = nbi();
    z.sqrTo(g[1], g2);
    while (n <= km)
    {
      g[n] = nbi();
      z.mulTo(g2, g[n - 2], g[n]);
      n += 2;
    }
  }
  var j = e.t - 1,
    w, is1 = true,
    r2 = nbi(),
    t;
  i = nbits(e[j]) - 1;
  while (j >= 0)
  {
    if (i >= k1) w = (e[j] >> (i - k1)) & km;
    else
    {
      w = (e[j] & ((1 << (i + 1)) - 1)) << (k1 - i);
      if (j > 0) w |= e[j - 1] >> (this.DB + i - k1);
    }
    n = k;
    while ((w & 1) == 0)
    {
      w >>= 1;
      --n;
    }
    if ((i -= n) < 0)
    {
      i += this.DB;
      --j;
    }
    if (is1)
    { // ret == 1, don't bother squaring or multiplying it
      g[w].copyTo(r);
      is1 = false;
    }
    else
    {
      while (n > 1)
      {
        z.sqrTo(r, r2);
        z.sqrTo(r2, r);
        n -= 2;
      }
      if (n > 0) z.sqrTo(r, r2);
      else
      {
        t = r;
        r = r2;
        r2 = t;
      }
      z.mulTo(r2, g[w], r);
    }
    while (j >= 0 && (e[j] & (1 << i)) == 0)
    {
      z.sqrTo(r, r2);
      t = r;
      r = r2;
      r2 = t;
      if (--i < 0)
      {
        i = this.DB - 1;
        --j;
      }
    }
  }
  return z.revert(r);
}
// (public) gcd(this,a) (HAC 14.54)
function bnGCD(a)
{
  var x = (this.s < 0) ? this.negate() : this.clone();
  var y = (a.s < 0) ? a.negate() : a.clone();
  if (x.compareTo(y) < 0)
  {
    var t = x;
    x = y;
    y = t;
  }
  var i = x.getLowestSetBit(),
    g = y.getLowestSetBit();
  if (g < 0) return x;
  if (i < g) g = i;
  if (g > 0)
  {
    x.rShiftTo(g, x);
    y.rShiftTo(g, y);
  }
  while (x.signum() > 0)
  {
    if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x);
    if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y);
    if (x.compareTo(y) >= 0)
    {
      x.subTo(y, x);
      x.rShiftTo(1, x);
    }
    else
    {
      y.subTo(x, y);
      y.rShiftTo(1, y);
    }
  }
  if (g > 0) y.lShiftTo(g, y);
  return y;
}
// (protected) this % n, n < 2^26
function bnpModInt(n)
{
  if (n <= 0) return 0;
  var d = this.DV % n,
    r = (this.s < 0) ? n - 1 : 0;
  if (this.t > 0)
    if (d == 0) r = this[0] % n;
    else
      for (var i = this.t - 1; i >= 0; --i) r = (d * r + this[i]) % n;
  return r;
}
// (public) 1/this % m (HAC 14.61)
function bnModInverse(m)
{
  var ac = m.isEven();
  if ((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
  var u = m.clone(),
    v = this.clone();
  var a = nbv(1),
    b = nbv(0),
    c = nbv(0),
    d = nbv(1);
  while (u.signum() != 0)
  {
    while (u.isEven())
    {
      u.rShiftTo(1, u);
      if (ac)
      {
        if (!a.isEven() || !b.isEven())
        {
          a.addTo(this, a);
          b.subTo(m, b);
        }
        a.rShiftTo(1, a);
      }
      else if (!b.isEven()) b.subTo(m, b);
      b.rShiftTo(1, b);
    }
    while (v.isEven())
    {
      v.rShiftTo(1, v);
      if (ac)
      {
        if (!c.isEven() || !d.isEven())
        {
          c.addTo(this, c);
          d.subTo(m, d);
        }
        c.rShiftTo(1, c);
      }
      else if (!d.isEven()) d.subTo(m, d);
      d.rShiftTo(1, d);
    }
    if (u.compareTo(v) >= 0)
    {
      u.subTo(v, u);
      if (ac) a.subTo(c, a);
      b.subTo(d, b);
    }
    else
    {
      v.subTo(u, v);
      if (ac) c.subTo(a, c);
      d.subTo(b, d);
    }
  }
  if (v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
  if (d.compareTo(m) >= 0) return d.subtract(m);
  if (d.signum() < 0) d.addTo(m, d);
  else return d;
  if (d.signum() < 0) return d.add(m);
  else return d;
}
var lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
var lplim = (1 << 26) / lowprimes[lowprimes.length - 1];
// (public) test primality with certainty >= 1-.5^t
function bnIsProbablePrime(t)
{
  var i, x = this.abs();
  if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1])
  {
    for (i = 0; i < lowprimes.length; ++i)
      if (x[0] == lowprimes[i]) return true;
    return false;
  }
  if (x.isEven()) return false;
  i = 1;
  while (i < lowprimes.length)
  {
    var m = lowprimes[i],
      j = i + 1;
    while (j < lowprimes.length && m < lplim) m *= lowprimes[j++];
    m = x.modInt(m);
    while (i < j)
      if (m % lowprimes[i++] == 0) return false;
  }
  return x.millerRabin(t);
}
// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
function bnpMillerRabin(t)
{
  var n1 = this.subtract(BigInteger.ONE);
  var k = n1.getLowestSetBit();
  if (k <= 0) return false;
  var r = n1.shiftRight(k);
  t = (t + 1) >> 1;
  if (t > lowprimes.length) t = lowprimes.length;
  var a = nbi();
  for (var i = 0; i < t; ++i)
  {
    //Pick bases at random, instead of starting at 2
    a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
    var y = a.modPow(r, this);
    if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0)
    {
      var j = 1;
      while (j++ < k && y.compareTo(n1) != 0)
      {
        y = y.modPowInt(2, this);
        if (y.compareTo(BigInteger.ONE) == 0) return false;
      }
      if (y.compareTo(n1) != 0) return false;
    }
  }
  return true;
}
// protected
BigInteger.prototype.chunkSize = bnpChunkSize;
BigInteger.prototype.toRadix = bnpToRadix;
BigInteger.prototype.fromRadix = bnpFromRadix;
BigInteger.prototype.fromNumber = bnpFromNumber;
BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
BigInteger.prototype.changeBit = bnpChangeBit;
BigInteger.prototype.addTo = bnpAddTo;
BigInteger.prototype.dMultiply = bnpDMultiply;
BigInteger.prototype.dAddOffset = bnpDAddOffset;
BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
BigInteger.prototype.modInt = bnpModInt;
BigInteger.prototype.millerRabin = bnpMillerRabin;
// public
BigInteger.prototype.clone = bnClone;
BigInteger.prototype.intValue = bnIntValue;
BigInteger.prototype.byteValue = bnByteValue;
BigInteger.prototype.shortValue = bnShortValue;
BigInteger.prototype.signum = bnSigNum;
BigInteger.prototype.toByteArray = bnToByteArray;
BigInteger.prototype.equals = bnEquals;
BigInteger.prototype.min = bnMin;
BigInteger.prototype.max = bnMax;
BigInteger.prototype.and = bnAnd;
BigInteger.prototype.or = bnOr;
BigInteger.prototype.xor = bnXor;
BigInteger.prototype.andNot = bnAndNot;
BigInteger.prototype.not = bnNot;
BigInteger.prototype.shiftLeft = bnShiftLeft;
BigInteger.prototype.shiftRight = bnShiftRight;
BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
BigInteger.prototype.bitCount = bnBitCount;
BigInteger.prototype.testBit = bnTestBit;
BigInteger.prototype.setBit = bnSetBit;
BigInteger.prototype.clearBit = bnClearBit;
BigInteger.prototype.flipBit = bnFlipBit;
BigInteger.prototype.add = bnAdd;
BigInteger.prototype.subtract = bnSubtract;
BigInteger.prototype.multiply = bnMultiply;
BigInteger.prototype.divide = bnDivide;
BigInteger.prototype.remainder = bnRemainder;
BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
BigInteger.prototype.modPow = bnModPow;
BigInteger.prototype.modInverse = bnModInverse;
BigInteger.prototype.pow = bnPow;
BigInteger.prototype.gcd = bnGCD;
BigInteger.prototype.isProbablePrime = bnIsProbablePrime;
// JSBN-specific extension
BigInteger.prototype.square = bnSquare;
var Int128 = BigInteger;
// BigInteger interfaces not implemented in jsbn:
// BigInteger(int signum, byte[] magnitude)
// double doubleValue()
// float floatValue()
// int hashCode()
// long longValue()
// static BigInteger valueOf(long val)
// Helper functions to make BigInteger functions callable with two parameters
// as in original C# Clipper
Int128.prototype.IsNegative = function ()
{
  if (this.compareTo(Int128.ZERO) == -1) return true;
  else return false;
};
Int128.op_Equality = function (val1, val2)
{
  if (val1.compareTo(val2) == 0) return true;
  else return false;
};
Int128.op_Inequality = function (val1, val2)
{
  if (val1.compareTo(val2) != 0) return true;
  else return false;
};
Int128.op_GreaterThan = function (val1, val2)
{
  if (val1.compareTo(val2) > 0) return true;
  else return false;
};
Int128.op_LessThan = function (val1, val2)
{
  if (val1.compareTo(val2) < 0) return true;
  else return false;
};
Int128.op_Addition = function (lhs, rhs)
{
  return new Int128(lhs).add(new Int128(rhs));
};
Int128.op_Subtraction = function (lhs, rhs)
{
  return new Int128(lhs).subtract(new Int128(rhs));
};
Int128.Int128Mul = function (lhs, rhs)
{
  return new Int128(lhs).multiply(new Int128(rhs));
};
Int128.op_Division = function (lhs, rhs)
{
  return lhs.divide(rhs);
};
Int128.prototype.ToDouble = function ()
{
  return parseFloat(this.toString()); // This could be something faster
};
// end of Int128 section
/*
// Uncomment the following two lines if you want to use Int128 outside ClipperLib
if (typeof(document) !== "undefined") window.Int128 = Int128;
else self.Int128 = Int128;
*/
// ---------------------------------------------  
// Here starts the actual Clipper library:
// Helper function to support Inheritance in Javascript
if (typeof (Inherit) == 'undefined')
{
  var Inherit = function (ce, ce2)
  {
    var p;
    if (typeof (Object.getOwnPropertyNames) == 'undefined')
    {
      for (p in ce2.prototype)
        if (typeof (ce.prototype[p]) == 'undefined' || ce.prototype[p] == Object.prototype[p]) ce.prototype[p] = ce2.prototype[p];
      for (p in ce2)
        if (typeof (ce[p]) == 'undefined') ce[p] = ce2[p];
      ce.$baseCtor = ce2;
    }
    else
    {
      var props = Object.getOwnPropertyNames(ce2.prototype);
      for (var i = 0; i < props.length; i++)
        if (typeof (Object.getOwnPropertyDescriptor(ce.prototype, props[i])) == 'undefined') Object.defineProperty(ce.prototype, props[i], Object.getOwnPropertyDescriptor(ce2.prototype, props[i]));
      for (p in ce2)
        if (typeof (ce[p]) == 'undefined') ce[p] = ce2[p];
      ce.$baseCtor = ce2;
    }
  };
}
ClipperLib.Path = function ()
{
  return [];
};
ClipperLib.Paths = function ()
{
  return []; // Was previously [[]], but caused problems when pushed
};
// Preserves the calling way of original C# Clipper
// Is essential due to compatibility, because DoublePoint is public class in original C# version
ClipperLib.DoublePoint = function ()
{
  var a = arguments;
  this.X = 0;
  this.Y = 0;
  // public DoublePoint(DoublePoint dp)
  // public DoublePoint(IntPoint ip)
  if (a.length == 1)
  {
    this.X = a[0].X;
    this.Y = a[0].Y;
  }
  else if (a.length == 2)
  {
    this.X = a[0];
    this.Y = a[1];
  }
}; // This is internal faster function when called without arguments
ClipperLib.DoublePoint0 = function ()
{
  this.X = 0;
  this.Y = 0;
};
// This is internal faster function when called with 1 argument (dp or ip)
ClipperLib.DoublePoint1 = function (dp)
{
  this.X = dp.X;
  this.Y = dp.Y;
};
// This is internal faster function when called with 2 arguments (x and y)
ClipperLib.DoublePoint2 = function (x, y)
{
  this.X = x;
  this.Y = y;
};
// PolyTree & PolyNode start
// -------------------------------
ClipperLib.PolyNode = function ()
{
  this.m_Parent = null;
  this.m_polygon = new ClipperLib.Path();
  this.m_Index = 0;
  this.m_jointype = 0;
  this.m_endtype = 0;
  this.m_Childs = [];
  this.IsOpen = false;
};
ClipperLib.PolyNode.prototype.IsHoleNode = function ()
{
  var result = true;
  var node = this.m_Parent;
  while (node !== null)
  {
    result = !result;
    node = node.m_Parent;
  }
  return result;
};
ClipperLib.PolyNode.prototype.ChildCount = function ()
{
  return this.m_Childs.length;
};
ClipperLib.PolyNode.prototype.Contour = function ()
{
  return this.m_polygon;
};
ClipperLib.PolyNode.prototype.AddChild = function (Child)
{
  var cnt = this.m_Childs.length;
  this.m_Childs.push(Child);
  Child.m_Parent = this;
  Child.m_Index = cnt;
};
ClipperLib.PolyNode.prototype.GetNext = function ()
{
  if (this.m_Childs.length > 0)
    return this.m_Childs[0];
  else
    return this.GetNextSiblingUp();
};
ClipperLib.PolyNode.prototype.GetNextSiblingUp = function ()
{
  if (this.m_Parent === null)
    return null;
  else if (this.m_Index == this.m_Parent.m_Childs.length - 1)
    return this.m_Parent.GetNextSiblingUp();
  else
    return this.m_Parent.m_Childs[this.m_Index + 1];
};
ClipperLib.PolyNode.prototype.Childs = function ()
{
  return this.m_Childs;
};
ClipperLib.PolyNode.prototype.Parent = function ()
{
  return this.m_Parent;
};
ClipperLib.PolyNode.prototype.IsHole = function ()
{
  return this.IsHoleNode();
};
// PolyTree : PolyNode
ClipperLib.PolyTree = function ()
{
  this.m_AllPolys = [];
  ClipperLib.PolyNode.call(this);
};
ClipperLib.PolyTree.prototype.Clear = function ()
{
  for (var i = 0, ilen = this.m_AllPolys.length; i < ilen; i++)
    this.m_AllPolys[i] = null;
  this.m_AllPolys.length = 0;
  this.m_Childs.length = 0;
};
ClipperLib.PolyTree.prototype.GetFirst = function ()
{
  if (this.m_Childs.length > 0)
    return this.m_Childs[0];
  else
    return null;
};
ClipperLib.PolyTree.prototype.Total = function ()
{
  return this.m_AllPolys.length;
};
Inherit(ClipperLib.PolyTree, ClipperLib.PolyNode);
// -------------------------------
// PolyTree & PolyNode end
ClipperLib.Math_Abs_Int64 = ClipperLib.Math_Abs_Int32 = ClipperLib.Math_Abs_Double = function (a)
{
  return Math.abs(a);
};
ClipperLib.Math_Max_Int32_Int32 = function (a, b)
{
  return Math.max(a, b);
};
/*
-----------------------------------
cast_32 speedtest: http://jsperf.com/truncate-float-to-integer/2
-----------------------------------
*/
if (browser.msie || browser.opera || browser.safari) ClipperLib.Cast_Int32 = function (a)
{
  return a | 0;
};
else ClipperLib.Cast_Int32 = function (a)
{ // eg. browser.chrome || browser.chromium || browser.firefox
  return~~ a;
};
/*
--------------------------
cast_64 speedtests: http://jsperf.com/truncate-float-to-integer
Chrome: bitwise_not_floor
Firefox17: toInteger (typeof test)
IE9: bitwise_or_floor
IE7 and IE8: to_parseint
Chromium: to_floor_or_ceil
Firefox3: to_floor_or_ceil
Firefox15: to_floor_or_ceil
Opera: to_floor_or_ceil
Safari: to_floor_or_ceil
--------------------------
*/
if (browser.chrome) ClipperLib.Cast_Int64 = function (a)
{
  if (a < -2147483648 || a > 2147483647)
    return a < 0 ? Math.ceil(a) : Math.floor(a);
  else return~~ a;
};
else if (browser.firefox && typeof (Number.toInteger) == "function") ClipperLib.Cast_Int64 = function (a)
{
  return Number.toInteger(a);
};
else if (browser.msie7 || browser.msie8) ClipperLib.Cast_Int64 = function (a)
{
  return parseInt(a, 10);
};
else if (browser.msie) ClipperLib.Cast_Int64 = function (a)
{
  if (a < -2147483648 || a > 2147483647)
    return a < 0 ? Math.ceil(a) : Math.floor(a);
  return a | 0;
};
// eg. browser.chromium || browser.firefox || browser.opera || browser.safari
else ClipperLib.Cast_Int64 = function (a)
{
  return a < 0 ? Math.ceil(a) : Math.floor(a);
};
ClipperLib.Clear = function (a)
{
  a.length = 0;
};
//ClipperLib.MaxSteps = 64; // How many steps at maximum in arc in BuildArc() function
ClipperLib.PI = 3.141592653589793;
ClipperLib.PI2 = 2 * 3.141592653589793;
ClipperLib.IntPoint = function ()
{
  var a = arguments,
    alen = a.length;
  this.X = 0;
  this.Y = 0;
  if (use_xyz)
  {
    this.Z = 0;
    if (alen == 3) // public IntPoint(cInt x, cInt y, cInt z = 0)
    {
      this.X = a[0];
      this.Y = a[1];
      this.Z = a[2];
    }
    else if (alen == 2) // public IntPoint(cInt x, cInt y)
    {
      this.X = a[0];
      this.Y = a[1];
      this.Z = 0;
    }
    else if (alen == 1)
    {
      if (a[0] instanceof ClipperLib.DoublePoint) // public IntPoint(DoublePoint dp)
      {
        var dp = a[0];
        this.X = ClipperLib.Clipper.Round(dp.X);
        this.Y = ClipperLib.Clipper.Round(dp.Y);
        this.Z = 0;
      }
      else // public IntPoint(IntPoint pt)
      {
        var pt = a[0];
        if (typeof (pt.Z) == "undefined") pt.Z = 0;
        this.X = pt.X;
        this.Y = pt.Y;
        this.Z = pt.Z;
      }
    }
    else // public IntPoint()
    {
      this.X = 0;
      this.Y = 0;
      this.Z = 0;
    }
  }
  else // if (!use_xyz)
  {
    if (alen == 2) // public IntPoint(cInt X, cInt Y)
    {
      this.X = a[0];
      this.Y = a[1];
    }
    else if (alen == 1)
    {
      if (a[0] instanceof ClipperLib.DoublePoint) // public IntPoint(DoublePoint dp)
      {
        var dp = a[0];
        this.X = ClipperLib.Clipper.Round(dp.X);
        this.Y = ClipperLib.Clipper.Round(dp.Y);
      }
      else // public IntPoint(IntPoint pt)
      {
        var pt = a[0];
        this.X = pt.X;
        this.Y = pt.Y;
      }
    }
    else // public IntPoint(IntPoint pt)
    {
      this.X = 0;
      this.Y = 0;
    }
  }
};
ClipperLib.IntPoint.op_Equality = function (a, b)
{
  //return a == b;
  return a.X == b.X && a.Y == b.Y;
};
ClipperLib.IntPoint.op_Inequality = function (a, b)
{
  //return a != b;
  return a.X != b.X || a.Y != b.Y;
};
/*
ClipperLib.IntPoint.prototype.Equals = function (obj)
{
  if (obj === null)
      return false;
  if (obj instanceof ClipperLib.IntPoint)
  {
      var a = Cast(obj, ClipperLib.IntPoint);
      return (this.X == a.X) && (this.Y == a.Y);
  }
  else
      return false;
};
*/
if (use_xyz)
{
  ClipperLib.IntPoint0 = function ()
  {
    this.X = 0;
    this.Y = 0;
    this.Z = 0;
  };
  ClipperLib.IntPoint1 = function (pt)
  {
    this.X = pt.X;
    this.Y = pt.Y;
    this.Z = pt.Z;
  };
  ClipperLib.IntPoint1dp = function (dp)
  {
    this.X = ClipperLib.Clipper.Round(dp.X);
    this.Y = ClipperLib.Clipper.Round(dp.Y);
    this.Z = 0;
  };
  ClipperLib.IntPoint2 = function (x, y)
  {
    this.X = x;
    this.Y = y;
    this.Z = 0;
  };
  ClipperLib.IntPoint3 = function (x, y, z)
  {
    this.X = x;
    this.Y = y;
    this.Z = z;
  };
}
else // if (!use_xyz)
{
  ClipperLib.IntPoint0 = function ()
  {
    this.X = 0;
    this.Y = 0;
  };
  ClipperLib.IntPoint1 = function (pt)
  {
    this.X = pt.X;
    this.Y = pt.Y;
  };
  ClipperLib.IntPoint1dp = function (dp)
  {
    this.X = ClipperLib.Clipper.Round(dp.X);
    this.Y = ClipperLib.Clipper.Round(dp.Y);
  };
  ClipperLib.IntPoint2 = function (x, y)
  {
    this.X = x;
    this.Y = y;
  };
}
ClipperLib.IntRect = function ()
{
  var a = arguments,
    alen = a.length;
  if (alen == 4) // function (l, t, r, b)
  {
    this.left = a[0];
    this.top = a[1];
    this.right = a[2];
    this.bottom = a[3];
  }
  else if (alen == 1) // function (ir)
  {
    this.left = ir.left;
    this.top = ir.top;
    this.right = ir.right;
    this.bottom = ir.bottom;
  }
  else // function ()
  {
    this.left = 0;
    this.top = 0;
    this.right = 0;
    this.bottom = 0;
  }
};
ClipperLib.IntRect0 = function ()
{
  this.left = 0;
  this.top = 0;
  this.right = 0;
  this.bottom = 0;
};
ClipperLib.IntRect1 = function (ir)
{
  this.left = ir.left;
  this.top = ir.top;
  this.right = ir.right;
  this.bottom = ir.bottom;
};
ClipperLib.IntRect4 = function (l, t, r, b)
{
  this.left = l;
  this.top = t;
  this.right = r;
  this.bottom = b;
};
ClipperLib.ClipType = {
  ctIntersection: 0,
  ctUnion: 1,
  ctDifference: 2,
  ctXor: 3
};
ClipperLib.PolyType = {
  ptSubject: 0,
  ptClip: 1
};
ClipperLib.PolyFillType = {
  pftEvenOdd: 0,
  pftNonZero: 1,
  pftPositive: 2,
  pftNegative: 3
};
ClipperLib.JoinType = {
  jtSquare: 0,
  jtRound: 1,
  jtMiter: 2
};
ClipperLib.EndType = {
  etOpenSquare: 0,
  etOpenRound: 1,
  etOpenButt: 2,
  etClosedLine: 3,
  etClosedPolygon: 4
};
if (use_deprecated)
  ClipperLib.EndType_ = {
    etSquare: 0,
    etRound: 1,
    etButt: 2,
    etClosed: 3
  };
ClipperLib.EdgeSide = {
  esLeft: 0,
  esRight: 1
};
ClipperLib.Direction = {
  dRightToLeft: 0,
  dLeftToRight: 1
};
ClipperLib.TEdge = function ()
{
  this.Bot = new ClipperLib.IntPoint();
  this.Curr = new ClipperLib.IntPoint();
  this.Top = new ClipperLib.IntPoint();
  this.Delta = new ClipperLib.IntPoint();
  this.Dx = 0;
  this.PolyTyp = ClipperLib.PolyType.ptSubject;
  this.Side = ClipperLib.EdgeSide.esLeft;
  this.WindDelta = 0;
  this.WindCnt = 0;
  this.WindCnt2 = 0;
  this.OutIdx = 0;
  this.Next = null;
  this.Prev = null;
  this.NextInLML = null;
  this.NextInAEL = null;
  this.PrevInAEL = null;
  this.NextInSEL = null;
  this.PrevInSEL = null;
};
ClipperLib.IntersectNode = function ()
{
  this.Edge1 = null;
  this.Edge2 = null;
  this.Pt = new ClipperLib.IntPoint();
};
ClipperLib.MyIntersectNodeSort = function () {};
ClipperLib.MyIntersectNodeSort.Compare = function (node1, node2)
{
  return (node2.Pt.Y - node1.Pt.Y);
};
ClipperLib.LocalMinima = function ()
{
  this.Y = 0;
  this.LeftBound = null;
  this.RightBound = null;
  this.Next = null;
};
ClipperLib.Scanbeam = function ()
{
  this.Y = 0;
  this.Next = null;
};
ClipperLib.OutRec = function ()
{
  this.Idx = 0;
  this.IsHole = false;
  this.IsOpen = false;
  this.FirstLeft = null;
  this.Pts = null;
  this.BottomPt = null;
  this.PolyNode = null;
};
ClipperLib.OutPt = function ()
{
  this.Idx = 0;
  this.Pt = new ClipperLib.IntPoint();
  this.Next = null;
  this.Prev = null;
};
ClipperLib.Join = function ()
{
  this.OutPt1 = null;
  this.OutPt2 = null;
  this.OffPt = new ClipperLib.IntPoint();
};
ClipperLib.ClipperBase = function ()
{
  this.m_MinimaList = null;
  this.m_CurrentLM = null;
  this.m_edges = new Array();
  this.m_UseFullRange = false;
  this.m_HasOpenPaths = false;
  this.PreserveCollinear = false;
  this.m_MinimaList = null;
  this.m_CurrentLM = null;
  this.m_UseFullRange = false;
  this.m_HasOpenPaths = false;
};
// Ranges are in original C# too high for Javascript (in current state 2013 september):
// protected const double horizontal = -3.4E+38;
// internal const cInt loRange = 0x3FFFFFFF; // = 1073741823 = sqrt(2^63 -1)/2
// internal const cInt hiRange = 0x3FFFFFFFFFFFFFFFL; // = 4611686018427387903 = sqrt(2^127 -1)/2
// So had to adjust them to more suitable for Javascript.
// If JS some day supports truly 64-bit integers, then these ranges can be as in C#
// and biginteger library can be more simpler (as then 128bit can be represented as two 64bit numbers)
ClipperLib.ClipperBase.horizontal = -9007199254740992; //-2^53
ClipperLib.ClipperBase.Skip = -2;
ClipperLib.ClipperBase.Unassigned = -1;
ClipperLib.ClipperBase.tolerance = 1E-20;
if (use_int32)
{
  ClipperLib.ClipperBase.loRange = 46340;
  ClipperLib.ClipperBase.hiRange = 46340;
}
else
{
  ClipperLib.ClipperBase.loRange = 47453132; // sqrt(2^53 -1)/2
  ClipperLib.ClipperBase.hiRange = 4503599627370495; // sqrt(2^106 -1)/2
}
ClipperLib.ClipperBase.near_zero = function (val)
{
  return (val > -ClipperLib.ClipperBase.tolerance) && (val < ClipperLib.ClipperBase.tolerance);
};
ClipperLib.ClipperBase.IsHorizontal = function (e)
{
  return e.Delta.Y === 0;
};
ClipperLib.ClipperBase.prototype.PointIsVertex = function (pt, pp)
{
  var pp2 = pp;
  do {
    if (ClipperLib.IntPoint.op_Equality(pp2.Pt, pt))
      return true;
    pp2 = pp2.Next;
  }
  while (pp2 != pp)
  return false;
};
ClipperLib.ClipperBase.prototype.PointOnLineSegment = function (pt, linePt1, linePt2, UseFullRange)
{
  if (UseFullRange)
    return ((pt.X == linePt1.X) && (pt.Y == linePt1.Y)) ||
      ((pt.X == linePt2.X) && (pt.Y == linePt2.Y)) ||
      (((pt.X > linePt1.X) == (pt.X < linePt2.X)) &&
      ((pt.Y > linePt1.Y) == (pt.Y < linePt2.Y)) &&
      (Int128.op_Equality(Int128.Int128Mul((pt.X - linePt1.X), (linePt2.Y - linePt1.Y)),
        Int128.Int128Mul((linePt2.X - linePt1.X), (pt.Y - linePt1.Y)))));
  else
    return ((pt.X == linePt1.X) && (pt.Y == linePt1.Y)) || ((pt.X == linePt2.X) && (pt.Y == linePt2.Y)) || (((pt.X > linePt1.X) == (pt.X < linePt2.X)) && ((pt.Y > linePt1.Y) == (pt.Y < linePt2.Y)) && ((pt.X - linePt1.X) * (linePt2.Y - linePt1.Y) == (linePt2.X - linePt1.X) * (pt.Y - linePt1.Y)));
};
ClipperLib.ClipperBase.prototype.PointOnPolygon = function (pt, pp, UseFullRange)
{
  var pp2 = pp;
  while (true)
  {
    if (this.PointOnLineSegment(pt, pp2.Pt, pp2.Next.Pt, UseFullRange))
      return true;
    pp2 = pp2.Next;
    if (pp2 == pp)
      break;
  }
  return false;
};
ClipperLib.ClipperBase.prototype.SlopesEqual = ClipperLib.ClipperBase.SlopesEqual = function ()
{
  var a = arguments,
    alen = a.length;
  var e1, e2, pt1, pt2, pt3, pt4, UseFullRange;
  if (alen == 3) // function (e1, e2, UseFullRange)
  {
    e1 = a[0];
    e2 = a[1];
    UseFullRange = a[2];
    if (UseFullRange)
      return Int128.op_Equality(Int128.Int128Mul(e1.Delta.Y, e2.Delta.X), Int128.Int128Mul(e1.Delta.X, e2.Delta.Y));
    else
      return ClipperLib.Cast_Int64((e1.Delta.Y) * (e2.Delta.X)) == ClipperLib.Cast_Int64((e1.Delta.X) * (e2.Delta.Y));
  }
  else if (alen == 4) // function (pt1, pt2, pt3, UseFullRange)
  {
    pt1 = a[0];
    pt2 = a[1];
    pt3 = a[2];
    UseFullRange = a[3];
    if (UseFullRange)
      return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt2.X - pt3.X), Int128.Int128Mul(pt1.X - pt2.X, pt2.Y - pt3.Y));
    else
      return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt2.X - pt3.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt2.Y - pt3.Y)) === 0;
  }
  else // function (pt1, pt2, pt3, pt4, UseFullRange)
  {
    pt1 = a[0];
    pt2 = a[1];
    pt3 = a[2];
    pt4 = a[3];
    UseFullRange = a[4];
    if (UseFullRange)
      return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt3.X - pt4.X), Int128.Int128Mul(pt1.X - pt2.X, pt3.Y - pt4.Y));
    else
      return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt3.X - pt4.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt3.Y - pt4.Y)) === 0;
  }
};
ClipperLib.ClipperBase.SlopesEqual3 = function (e1, e2, UseFullRange)
{
  if (UseFullRange)
    return Int128.op_Equality(Int128.Int128Mul(e1.Delta.Y, e2.Delta.X), Int128.Int128Mul(e1.Delta.X, e2.Delta.Y));
  else
    return ClipperLib.Cast_Int64((e1.Delta.Y) * (e2.Delta.X)) == ClipperLib.Cast_Int64((e1.Delta.X) * (e2.Delta.Y));
};
ClipperLib.ClipperBase.SlopesEqual4 = function (pt1, pt2, pt3, UseFullRange)
{
  if (UseFullRange)
    return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt2.X - pt3.X), Int128.Int128Mul(pt1.X - pt2.X, pt2.Y - pt3.Y));
  else
    return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt2.X - pt3.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt2.Y - pt3.Y)) === 0;
};
ClipperLib.ClipperBase.SlopesEqual5 = function (pt1, pt2, pt3, pt4, UseFullRange)
{
  if (UseFullRange)
    return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt3.X - pt4.X), Int128.Int128Mul(pt1.X - pt2.X, pt3.Y - pt4.Y));
  else
    return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt3.X - pt4.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt3.Y - pt4.Y)) === 0;
};
ClipperLib.ClipperBase.prototype.Clear = function ()
{
  this.DisposeLocalMinimaList();
  for (var i = 0, ilen = this.m_edges.length; i < ilen; ++i)
  {
    for (var j = 0, jlen = this.m_edges[i].length; j < jlen; ++j)
      this.m_edges[i][j] = null;
    ClipperLib.Clear(this.m_edges[i]);
  }
  ClipperLib.Clear(this.m_edges);
  this.m_UseFullRange = false;
  this.m_HasOpenPaths = false;
};
ClipperLib.ClipperBase.prototype.DisposeLocalMinimaList = function ()
{
  while (this.m_MinimaList !== null)
  {
    var tmpLm = this.m_MinimaList.Next;
    this.m_MinimaList = null;
    this.m_MinimaList = tmpLm;
  }
  this.m_CurrentLM = null;
};
ClipperLib.ClipperBase.prototype.RangeTest = function (Pt, useFullRange)
{
  if (useFullRange.Value)
  {
    if (Pt.X > ClipperLib.ClipperBase.hiRange || Pt.Y > ClipperLib.ClipperBase.hiRange || -Pt.X > ClipperLib.ClipperBase.hiRange || -Pt.Y > ClipperLib.ClipperBase.hiRange)
      ClipperLib.Error("Coordinate outside allowed range in RangeTest().");
  }
  else if (Pt.X > ClipperLib.ClipperBase.loRange || Pt.Y > ClipperLib.ClipperBase.loRange || -Pt.X > ClipperLib.ClipperBase.loRange || -Pt.Y > ClipperLib.ClipperBase.loRange)
  {
    useFullRange.Value = true;
    this.RangeTest(Pt, useFullRange);
  }
};
ClipperLib.ClipperBase.prototype.InitEdge = function (e, eNext, ePrev, pt)
{
  e.Next = eNext;
  e.Prev = ePrev;
  //e.Curr = pt;
  e.Curr.X = pt.X;
  e.Curr.Y = pt.Y;
  e.OutIdx = -1;
};
ClipperLib.ClipperBase.prototype.InitEdge2 = function (e, polyType)
{
  if (e.Curr.Y >= e.Next.Curr.Y)
  {
    //e.Bot = e.Curr;
    e.Bot.X = e.Curr.X;
    e.Bot.Y = e.Curr.Y;
    //e.Top = e.Next.Curr;
    e.Top.X = e.Next.Curr.X;
    e.Top.Y = e.Next.Curr.Y;
  }
  else
  {
    //e.Top = e.Curr;
    e.Top.X = e.Curr.X;
    e.Top.Y = e.Curr.Y;
    //e.Bot = e.Next.Curr;
    e.Bot.X = e.Next.Curr.X;
    e.Bot.Y = e.Next.Curr.Y;
  }
  this.SetDx(e);
  e.PolyTyp = polyType;
};
ClipperLib.ClipperBase.prototype.FindNextLocMin = function (E)
{
  var E2;
  for (;;)
  {
    while (ClipperLib.IntPoint.op_Inequality(E.Bot, E.Prev.Bot) || ClipperLib.IntPoint.op_Equality(E.Curr, E.Top))
      E = E.Next;
    if (E.Dx != ClipperLib.ClipperBase.horizontal && E.Prev.Dx != ClipperLib.ClipperBase.horizontal)
      break;
    while (E.Prev.Dx == ClipperLib.ClipperBase.horizontal)
      E = E.Prev;
    E2 = E;
    while (E.Dx == ClipperLib.ClipperBase.horizontal)
      E = E.Next;
    if (E.Top.Y == E.Prev.Bot.Y)
      continue;
    //ie just an intermediate horz.
    if (E2.Prev.Bot.X < E.Bot.X)
      E = E2;
    break;
  }
  return E;
};
ClipperLib.ClipperBase.prototype.ProcessBound = function (E, IsClockwise)
{
  var EStart = E,
    Result = E;
  var Horz;
  var StartX;
  if (E.Dx == ClipperLib.ClipperBase.horizontal)
  {
    //it's possible for adjacent overlapping horz edges to start heading left
    //before finishing right, so ...
    if (IsClockwise)
      StartX = E.Prev.Bot.X;
    else
      StartX = E.Next.Bot.X;
    if (E.Bot.X != StartX)
      this.ReverseHorizontal(E);
  }
  if (Result.OutIdx != ClipperLib.ClipperBase.Skip)
  {
    if (IsClockwise)
    {
      while (Result.Top.Y == Result.Next.Bot.Y && Result.Next.OutIdx != ClipperLib.ClipperBase.Skip)
        Result = Result.Next;
      if (Result.Dx == ClipperLib.ClipperBase.horizontal && Result.Next.OutIdx != ClipperLib.ClipperBase.Skip)
      {
        //nb: at the top of a bound, horizontals are added to the bound
        //only when the preceding edge attaches to the horizontal's left vertex
        //unless a Skip edge is encountered when that becomes the top divide
        Horz = Result;
        while (Horz.Prev.Dx == ClipperLib.ClipperBase.horizontal)
          Horz = Horz.Prev;
        if (Horz.Prev.Top.X == Result.Next.Top.X)
        {
          if (!IsClockwise)
            Result = Horz.Prev;
        }
        else if (Horz.Prev.Top.X > Result.Next.Top.X)
          Result = Horz.Prev;
      }
      while (E != Result)
      {
        E.NextInLML = E.Next;
        if (E.Dx == ClipperLib.ClipperBase.horizontal && E != EStart && E.Bot.X != E.Prev.Top.X)
          this.ReverseHorizontal(E);
        E = E.Next;
      }
      if (E.Dx == ClipperLib.ClipperBase.horizontal && E != EStart && E.Bot.X != E.Prev.Top.X)
        this.ReverseHorizontal(E);
      Result = Result.Next;
      //move to the edge just beyond current bound
    }
    else
    {
      while (Result.Top.Y == Result.Prev.Bot.Y && Result.Prev.OutIdx != ClipperLib.ClipperBase.Skip)
        Result = Result.Prev;
      if (Result.Dx == ClipperLib.ClipperBase.horizontal && Result.Prev.OutIdx != ClipperLib.ClipperBase.Skip)
      {
        Horz = Result;
        while (Horz.Next.Dx == ClipperLib.ClipperBase.horizontal)
          Horz = Horz.Next;
        if (Horz.Next.Top.X == Result.Prev.Top.X)
        {
          if (!IsClockwise)
            Result = Horz.Next;
        }
        else if (Horz.Next.Top.X > Result.Prev.Top.X)
          Result = Horz.Next;
      }
      while (E != Result)
      {
        E.NextInLML = E.Prev;
        if (E.Dx == ClipperLib.ClipperBase.horizontal && E != EStart && E.Bot.X != E.Next.Top.X)
          this.ReverseHorizontal(E);
        E = E.Prev;
      }
      if (E.Dx == ClipperLib.ClipperBase.horizontal && E != EStart && E.Bot.X != E.Next.Top.X)
        this.ReverseHorizontal(E);
      Result = Result.Prev;
      //move to the edge just beyond current bound
    }
  }
  if (Result.OutIdx == ClipperLib.ClipperBase.Skip)
  {
    //if edges still remain in the current bound beyond the skip edge then
    //create another LocMin and call ProcessBound once more
    E = Result;
    if (IsClockwise)
    {
      while (E.Top.Y == E.Next.Bot.Y)
        E = E.Next;
      //don't include top horizontals when parsing a bound a second time,
      //they will be contained in the opposite bound ...
      while (E != Result && E.Dx == ClipperLib.ClipperBase.horizontal)
        E = E.Prev;
    }
    else
    {
      while (E.Top.Y == E.Prev.Bot.Y)
        E = E.Prev;
      while (E != Result && E.Dx == ClipperLib.ClipperBase.horizontal)
        E = E.Next;
    }
    if (E == Result)
    {
      if (IsClockwise)
        Result = E.Next;
      else
        Result = E.Prev;
    }
    else
    {
      //there are more edges in the bound beyond result starting with E
      if (IsClockwise)
        E = Result.Next;
      else
        E = Result.Prev;
      var locMin = new ClipperLib.LocalMinima();
      locMin.Next = null;
      locMin.Y = E.Bot.Y;
      locMin.LeftBound = null;
      locMin.RightBound = E;
      locMin.RightBound.WindDelta = 0;
      Result = this.ProcessBound(locMin.RightBound, IsClockwise);
      this.InsertLocalMinima(locMin);
    }
  }
  return Result;
};
ClipperLib.ClipperBase.prototype.AddPath = function (pg, polyType, Closed)
{
  if (use_lines)
  {
    if (!Closed && polyType == ClipperLib.PolyType.ptClip)
      ClipperLib.Error("AddPath: Open paths must be subject.");
  }
  else
  {
    if (!Closed)
      ClipperLib.Error("AddPath: Open paths have been disabled.");
  }
  var highI = pg.length - 1;
  if (Closed)
    while (highI > 0 && (ClipperLib.IntPoint.op_Equality(pg[highI], pg[0])))
  --highI;
  while (highI > 0 && (ClipperLib.IntPoint.op_Equality(pg[highI], pg[highI - 1])))
  --highI;
  if ((Closed && highI < 2) || (!Closed && highI < 1))
    return false;
  //create a new edge array ...
  var edges = new Array();
  for (var i = 0; i <= highI; i++)
    edges.push(new ClipperLib.TEdge());
  var IsFlat = true;
  //1. Basic (first) edge initialization ...

  //edges[1].Curr = pg[1];
  edges[1].Curr.X = pg[1].X;
  edges[1].Curr.Y = pg[1].Y;

  var $1 = {Value: this.m_UseFullRange};
  this.RangeTest(pg[0], $1);
  this.m_UseFullRange = $1.Value;

  $1.Value = this.m_UseFullRange;
  this.RangeTest(pg[highI], $1);
  this.m_UseFullRange = $1.Value;

  this.InitEdge(edges[0], edges[1], edges[highI], pg[0]);
  this.InitEdge(edges[highI], edges[0], edges[highI - 1], pg[highI]);
  for (var i = highI - 1; i >= 1; --i)
  {
    $1.Value = this.m_UseFullRange;
    this.RangeTest(pg[i], $1);
    this.m_UseFullRange = $1.Value;

    this.InitEdge(edges[i], edges[i + 1], edges[i - 1], pg[i]);
  }

  var eStart = edges[0];
  //2. Remove duplicate vertices, and (when closed) collinear edges ...
  var E = eStart,
    eLoopStop = eStart;
  for (;;)
  {
    if (ClipperLib.IntPoint.op_Equality(E.Curr, E.Next.Curr))
    {
      if (E == E.Next)
        break;
      if (E == eStart)
        eStart = E.Next;
      E = this.RemoveEdge(E);
      eLoopStop = E;
      continue;
    }
    if (E.Prev == E.Next)
      break;
    else if (Closed && ClipperLib.ClipperBase.SlopesEqual(E.Prev.Curr, E.Curr, E.Next.Curr, this.m_UseFullRange) && (!this.PreserveCollinear || !this.Pt2IsBetweenPt1AndPt3(E.Prev.Curr, E.Curr, E.Next.Curr)))
    {
      //Collinear edges are allowed for open paths but in closed paths
      //the default is to merge adjacent collinear edges into a single edge.
      //However, if the PreserveCollinear property is enabled, only overlapping
      //collinear edges (ie spikes) will be removed from closed paths.
      if (E == eStart)
        eStart = E.Next;
      E = this.RemoveEdge(E);
      E = E.Prev;
      eLoopStop = E;
      continue;
    }
    E = E.Next;
    if (E == eLoopStop)
      break;
  }
  if ((!Closed && (E == E.Next)) || (Closed && (E.Prev == E.Next)))
    return false;
  if (!Closed)
  {
    this.m_HasOpenPaths = true;
    eStart.Prev.OutIdx = ClipperLib.ClipperBase.Skip;
  }
  //3. Do second stage of edge initialization ...
  var eHighest = eStart;
  E = eStart;
  do {
    this.InitEdge2(E, polyType);
    E = E.Next;
    if (IsFlat && E.Curr.Y != eStart.Curr.Y)
      IsFlat = false;
  }
  while (E != eStart)
  //4. Finally, add edge bounds to LocalMinima list ...
  //Totally flat paths must be handled differently when adding them
  //to LocalMinima list to avoid endless loops etc ...
  if (IsFlat)
  {
    if (Closed)
      return false;
    E.Prev.OutIdx = ClipperLib.ClipperBase.Skip;
    if (E.Prev.Bot.X < E.Prev.Top.X)
      this.ReverseHorizontal(E.Prev);
    var locMin = new ClipperLib.LocalMinima();
    locMin.Next = null;
    locMin.Y = E.Bot.Y;
    locMin.LeftBound = null;
    locMin.RightBound = E;
    locMin.RightBound.Side = ClipperLib.EdgeSide.esRight;
    locMin.RightBound.WindDelta = 0;
    while (E.Next.OutIdx != ClipperLib.ClipperBase.Skip)
    {
      E.NextInLML = E.Next;
      if (E.Bot.X != E.Prev.Top.X)
        this.ReverseHorizontal(E);
      E = E.Next;
    }
    this.InsertLocalMinima(locMin);
    this.m_edges.push(edges);
    return true;
  }
  this.m_edges.push(edges);
  var clockwise;
  var EMin = null;
  for (;;)
  {
    E = this.FindNextLocMin(E);
    if (E == EMin)
      break;
    else if (EMin == null)
      EMin = E;
    //E and E.Prev now share a local minima (left aligned if horizontal).
    //Compare their slopes to find which starts which bound ...
    var locMin = new ClipperLib.LocalMinima();
    locMin.Next = null;
    locMin.Y = E.Bot.Y;
    if (E.Dx < E.Prev.Dx)
    {
      locMin.LeftBound = E.Prev;
      locMin.RightBound = E;
      clockwise = false;
      //Q.nextInLML = Q.prev
    }
    else
    {
      locMin.LeftBound = E;
      locMin.RightBound = E.Prev;
      clockwise = true;
      //Q.nextInLML = Q.next
    }
    locMin.LeftBound.Side = ClipperLib.EdgeSide.esLeft;
    locMin.RightBound.Side = ClipperLib.EdgeSide.esRight;
    if (!Closed)
      locMin.LeftBound.WindDelta = 0;
    else if (locMin.LeftBound.Next == locMin.RightBound)
      locMin.LeftBound.WindDelta = -1;
    else
      locMin.LeftBound.WindDelta = 1;
    locMin.RightBound.WindDelta = -locMin.LeftBound.WindDelta;
    E = this.ProcessBound(locMin.LeftBound, clockwise);
    var E2 = this.ProcessBound(locMin.RightBound, !clockwise);
    if (locMin.LeftBound.OutIdx == ClipperLib.ClipperBase.Skip)
      locMin.LeftBound = null;
    else if (locMin.RightBound.OutIdx == ClipperLib.ClipperBase.Skip)
      locMin.RightBound = null;
    this.InsertLocalMinima(locMin);
    if (!clockwise)
      E = E2;
  }
  return true;
};
ClipperLib.ClipperBase.prototype.AddPaths = function (ppg, polyType, closed)
{
  //  console.log("-------------------------------------------");
  //  console.log(JSON.stringify(ppg));
  var result = false;
  for (var i = 0, ilen = ppg.length; i < ilen; ++i)
    if (this.AddPath(ppg[i], polyType, closed))
      result = true;
  return result;
};
//------------------------------------------------------------------------------
ClipperLib.ClipperBase.prototype.Pt2IsBetweenPt1AndPt3 = function (pt1, pt2, pt3)
{
  if ((ClipperLib.IntPoint.op_Equality(pt1, pt3)) || (ClipperLib.IntPoint.op_Equality(pt1, pt2)) ||
    (ClipperLib.IntPoint.op_Equality(pt3, pt2)))
    return false;
  else if (pt1.X != pt3.X)
    return (pt2.X > pt1.X) == (pt2.X < pt3.X);
  else
    return (pt2.Y > pt1.Y) == (pt2.Y < pt3.Y);
};
ClipperLib.ClipperBase.prototype.RemoveEdge = function (e)
{
  //removes e from double_linked_list (but without removing from memory)
  e.Prev.Next = e.Next;
  e.Next.Prev = e.Prev;
  var result = e.Next;
  e.Prev = null; //flag as removed (see ClipperBase.Clear)
  return result;
};
ClipperLib.ClipperBase.prototype.SetDx = function (e)
{
  e.Delta.X = (e.Top.X - e.Bot.X);
  e.Delta.Y = (e.Top.Y - e.Bot.Y);
  if (e.Delta.Y === 0) e.Dx = ClipperLib.ClipperBase.horizontal;
  else e.Dx = (e.Delta.X) / (e.Delta.Y);
};
ClipperLib.ClipperBase.prototype.InsertLocalMinima = function (newLm)
{
  if (this.m_MinimaList === null)
  {
    this.m_MinimaList = newLm;
  }
  else if (newLm.Y >= this.m_MinimaList.Y)
  {
    newLm.Next = this.m_MinimaList;
    this.m_MinimaList = newLm;
  }
  else
  {
    var tmpLm = this.m_MinimaList;
    while (tmpLm.Next !== null && (newLm.Y < tmpLm.Next.Y))
      tmpLm = tmpLm.Next;
    newLm.Next = tmpLm.Next;
    tmpLm.Next = newLm;
  }
};
ClipperLib.ClipperBase.prototype.PopLocalMinima = function ()
{
  if (this.m_CurrentLM === null)
    return;
  this.m_CurrentLM = this.m_CurrentLM.Next;
};
ClipperLib.ClipperBase.prototype.ReverseHorizontal = function (e)
{
  //swap horizontal edges' top and bottom x's so they follow the natural
  //progression of the bounds - ie so their xbots will align with the
  //adjoining lower edge. [Helpful in the ProcessHorizontal() method.]
  var tmp = e.Top.X;
  e.Top.X = e.Bot.X;
  e.Bot.X = tmp;
  if (use_xyz)
  {
    tmp = e.Top.Z;
    e.Top.Z = e.Bot.Z;
    e.Bot.Z = tmp;
  }
};
ClipperLib.ClipperBase.prototype.Reset = function ()
{
  this.m_CurrentLM = this.m_MinimaList;
  if (this.m_CurrentLM == null)
    return;
  //ie nothing to process
  //reset all edges ...
  var lm = this.m_MinimaList;
  while (lm != null)
  {
    var e = lm.LeftBound;
    if (e != null)
    {
      //e.Curr = e.Bot;
      e.Curr.X = e.Bot.X;
      e.Curr.Y = e.Bot.Y;
      e.Side = ClipperLib.EdgeSide.esLeft;
      e.OutIdx = ClipperLib.ClipperBase.Unassigned;
    }
    e = lm.RightBound;
    if (e != null)
    {
      //e.Curr = e.Bot;
      e.Curr.X = e.Bot.X;
      e.Curr.Y = e.Bot.Y;
      e.Side = ClipperLib.EdgeSide.esRight;
      e.OutIdx = ClipperLib.ClipperBase.Unassigned;
    }
    lm = lm.Next;
  }
};
ClipperLib.Clipper = function (InitOptions) // public Clipper(int InitOptions = 0)
{
  if (typeof (InitOptions) == "undefined") InitOptions = 0;
  this.m_PolyOuts = null;
  this.m_ClipType = ClipperLib.ClipType.ctIntersection;
  this.m_Scanbeam = null;
  this.m_ActiveEdges = null;
  this.m_SortedEdges = null;
  this.m_IntersectList = null;
  this.m_IntersectNodeComparer = null;
  this.m_ExecuteLocked = false;
  this.m_ClipFillType = ClipperLib.PolyFillType.pftEvenOdd;
  this.m_SubjFillType = ClipperLib.PolyFillType.pftEvenOdd;
  this.m_Joins = null;
  this.m_GhostJoins = null;
  this.m_UsingPolyTree = false;
  this.ReverseSolution = false;
  this.StrictlySimple = false;
  ClipperLib.ClipperBase.call(this);
  this.m_Scanbeam = null;
  this.m_ActiveEdges = null;
  this.m_SortedEdges = null;
  this.m_IntersectList = new Array();
  this.m_IntersectNodeComparer = ClipperLib.MyIntersectNodeSort.Compare;
  this.m_ExecuteLocked = false;
  this.m_UsingPolyTree = false;
  this.m_PolyOuts = new Array();
  this.m_Joins = new Array();
  this.m_GhostJoins = new Array();
  this.ReverseSolution = (1 & InitOptions) !== 0;
  this.StrictlySimple = (2 & InitOptions) !== 0;
  this.PreserveCollinear = (4 & InitOptions) !== 0;
  if (use_xyz)
  {
    this.ZFillFunction = null; // function (IntPoint vert1, IntPoint vert2, ref IntPoint intersectPt);
  }
};
ClipperLib.Clipper.ioReverseSolution = 1;
ClipperLib.Clipper.ioStrictlySimple = 2;
ClipperLib.Clipper.ioPreserveCollinear = 4;

ClipperLib.Clipper.prototype.Clear = function ()
{
  if (this.m_edges.length === 0)
    return;
  //avoids problems with ClipperBase destructor
  this.DisposeAllPolyPts();
  ClipperLib.ClipperBase.prototype.Clear.call(this);
};

ClipperLib.Clipper.prototype.DisposeScanbeamList = function ()
{
  while (this.m_Scanbeam !== null)
  {
    var sb2 = this.m_Scanbeam.Next;
    this.m_Scanbeam = null;
    this.m_Scanbeam = sb2;
  }
};
ClipperLib.Clipper.prototype.Reset = function ()
{
  ClipperLib.ClipperBase.prototype.Reset.call(this);
  this.m_Scanbeam = null;
  this.m_ActiveEdges = null;
  this.m_SortedEdges = null;

  var lm = this.m_MinimaList;
  while (lm !== null)
  {
    this.InsertScanbeam(lm.Y);
    lm = lm.Next;
  }
};
ClipperLib.Clipper.prototype.InsertScanbeam = function (Y)
{
  if (this.m_Scanbeam === null)
  {
    this.m_Scanbeam = new ClipperLib.Scanbeam();
    this.m_Scanbeam.Next = null;
    this.m_Scanbeam.Y = Y;
  }
  else if (Y > this.m_Scanbeam.Y)
  {
    var newSb = new ClipperLib.Scanbeam();
    newSb.Y = Y;
    newSb.Next = this.m_Scanbeam;
    this.m_Scanbeam = newSb;
  }
  else
  {
    var sb2 = this.m_Scanbeam;
    while (sb2.Next !== null && (Y <= sb2.Next.Y))
      sb2 = sb2.Next;
    if (Y == sb2.Y)
      return;
    //ie ignores duplicates
    var newSb = new ClipperLib.Scanbeam();
    newSb.Y = Y;
    newSb.Next = sb2.Next;
    sb2.Next = newSb;
  }
};
// ************************************
ClipperLib.Clipper.prototype.Execute = function ()
{
  var a = arguments,
    alen = a.length,
    ispolytree = a[1] instanceof ClipperLib.PolyTree;
  if (alen == 4 && !ispolytree) // function (clipType, solution, subjFillType, clipFillType)
  {
    var clipType = a[0],
      solution = a[1],
      subjFillType = a[2],
      clipFillType = a[3];
    if (this.m_ExecuteLocked)
      return false;
    if (this.m_HasOpenPaths)
      ClipperLib.Error("Error: PolyTree struct is need for open path clipping.");
    this.m_ExecuteLocked = true;
    ClipperLib.Clear(solution);
    this.m_SubjFillType = subjFillType;
    this.m_ClipFillType = clipFillType;
    this.m_ClipType = clipType;
    this.m_UsingPolyTree = false;
    try
    {
      var succeeded = this.ExecuteInternal();
      //build the return polygons ...
      if (succeeded) this.BuildResult(solution);
    }
    finally
    {
      this.DisposeAllPolyPts();
      this.m_ExecuteLocked = false;
    }
    return succeeded;
  }
  else if (alen == 4 && ispolytree) // function (clipType, polytree, subjFillType, clipFillType)
  {
    var clipType = a[0],
      polytree = a[1],
      subjFillType = a[2],
      clipFillType = a[3];
    if (this.m_ExecuteLocked)
      return false;
    this.m_ExecuteLocked = true;
    this.m_SubjFillType = subjFillType;
    this.m_ClipFillType = clipFillType;
    this.m_ClipType = clipType;
    this.m_UsingPolyTree = true;
    try
    {
      var succeeded = this.ExecuteInternal();
      //build the return polygons ...
      if (succeeded) this.BuildResult2(polytree);
    }
    finally
    {
      this.DisposeAllPolyPts();
      this.m_ExecuteLocked = false;
    }
    return succeeded;
  }
  else if (alen == 2 && !ispolytree) // function (clipType, solution)
  {
    var clipType = a[0],
      solution = a[1];
    return this.Execute(clipType, solution, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
  }
  else if (alen == 2 && ispolytree) // function (clipType, polytree)
  {
    var clipType = a[0],
      polytree = a[1];
    return this.Execute(clipType, polytree, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
  }
};
ClipperLib.Clipper.prototype.FixHoleLinkage = function (outRec)
{
  //skip if an outermost polygon or
  //already already points to the correct FirstLeft ...
  if (outRec.FirstLeft === null || (outRec.IsHole != outRec.FirstLeft.IsHole && outRec.FirstLeft.Pts !== null))
    return;
  var orfl = outRec.FirstLeft;
  while (orfl !== null && ((orfl.IsHole == outRec.IsHole) || orfl.Pts === null))
    orfl = orfl.FirstLeft;
  outRec.FirstLeft = orfl;
};
ClipperLib.Clipper.prototype.ExecuteInternal = function ()
{
  try
  {
    this.Reset();
    if (this.m_CurrentLM === null)
      return false;
    var botY = this.PopScanbeam();
    do {
      this.InsertLocalMinimaIntoAEL(botY);
      ClipperLib.Clear(this.m_GhostJoins);
      this.ProcessHorizontals(false);
      if (this.m_Scanbeam === null)
        break;
      var topY = this.PopScanbeam();
      //console.log("botY:" + botY + ", topY:" + topY);
      if (!this.ProcessIntersections(botY, topY))
        return false;
      this.ProcessEdgesAtTopOfScanbeam(topY);
      botY = topY;
    }
    while (this.m_Scanbeam !== null || this.m_CurrentLM !== null)
    //fix orientations ...
    for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
    {
      var outRec = this.m_PolyOuts[i];
      if (outRec.Pts === null || outRec.IsOpen)
        continue;
      if ((outRec.IsHole ^ this.ReverseSolution) == (this.Area(outRec) > 0))
        this.ReversePolyPtLinks(outRec.Pts);
    }
    this.JoinCommonEdges();
    for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
    {
      var outRec = this.m_PolyOuts[i];
      if (outRec.Pts !== null && !outRec.IsOpen)
        this.FixupOutPolygon(outRec);
    }
    if (this.StrictlySimple)
      this.DoSimplePolygons();
    return true;
  }
  finally
  {
    ClipperLib.Clear(this.m_Joins);
    ClipperLib.Clear(this.m_GhostJoins);
  }
};
ClipperLib.Clipper.prototype.PopScanbeam = function ()
{
  var Y = this.m_Scanbeam.Y;
  var sb2 = this.m_Scanbeam;
  this.m_Scanbeam = this.m_Scanbeam.Next;
  sb2 = null;
  return Y;
};
ClipperLib.Clipper.prototype.DisposeAllPolyPts = function ()
{
  for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; ++i)
    this.DisposeOutRec(i);
  ClipperLib.Clear(this.m_PolyOuts);
};
ClipperLib.Clipper.prototype.DisposeOutRec = function (index)
{
  var outRec = this.m_PolyOuts[index];
  if (outRec.Pts !== null)
    this.DisposeOutPts(outRec.Pts);
  outRec = null;
  this.m_PolyOuts[index] = null;
};
ClipperLib.Clipper.prototype.DisposeOutPts = function (pp)
{
  if (pp === null)
    return;
  var tmpPp = null;
  pp.Prev.Next = null;
  while (pp !== null)
  {
    tmpPp = pp;
    pp = pp.Next;
    tmpPp = null;
  }
};
ClipperLib.Clipper.prototype.AddJoin = function (Op1, Op2, OffPt)
{
  var j = new ClipperLib.Join();
  j.OutPt1 = Op1;
  j.OutPt2 = Op2;
  //j.OffPt = OffPt;
  j.OffPt.X = OffPt.X;
  j.OffPt.Y = OffPt.Y;
  this.m_Joins.push(j);
};
ClipperLib.Clipper.prototype.AddGhostJoin = function (Op, OffPt)
{
  var j = new ClipperLib.Join();
  j.OutPt1 = Op;
  //j.OffPt = OffPt;
  j.OffPt.X = OffPt.X;
  j.OffPt.Y = OffPt.Y;
  this.m_GhostJoins.push(j);
};
if (use_xyz)
{
  ClipperLib.Clipper.prototype.SetZ = function (pt, e)
  {
    pt.Z = 0;
    if (this.ZFillFunction !== null)
    {
      //put the 'preferred' point as first parameter ...
      if (e.OutIdx < 0)
        this.ZFillFunction(e.Bot, e.Top, pt); //outside a path so presume entering
      else
        this.ZFillFunction(e.Top, e.Bot, pt); //inside a path so presume exiting
    }
  };
  //------------------------------------------------------------------------------
}
ClipperLib.Clipper.prototype.InsertLocalMinimaIntoAEL = function (botY)
{
  while (this.m_CurrentLM !== null && (this.m_CurrentLM.Y == botY))
  {
    var lb = this.m_CurrentLM.LeftBound;
    var rb = this.m_CurrentLM.RightBound;
    this.PopLocalMinima();
    var Op1 = null;
    if (lb === null)
    {
      this.InsertEdgeIntoAEL(rb, null);
      this.SetWindingCount(rb);
      if (this.IsContributing(rb))
        Op1 = this.AddOutPt(rb, rb.Bot);
    }
    else if (rb == null)
    {
      this.InsertEdgeIntoAEL(lb, null);
      this.SetWindingCount(lb);
      if (this.IsContributing(lb))
        Op1 = this.AddOutPt(lb, lb.Bot);
      this.InsertScanbeam(lb.Top.Y);
    }
    else
    {
      this.InsertEdgeIntoAEL(lb, null);
      this.InsertEdgeIntoAEL(rb, lb);
      this.SetWindingCount(lb);
      rb.WindCnt = lb.WindCnt;
      rb.WindCnt2 = lb.WindCnt2;
      if (this.IsContributing(lb))
        Op1 = this.AddLocalMinPoly(lb, rb, lb.Bot);
      this.InsertScanbeam(lb.Top.Y);
    }
    if (rb != null)
    {
      if (ClipperLib.ClipperBase.IsHorizontal(rb))
        this.AddEdgeToSEL(rb);
      else
        this.InsertScanbeam(rb.Top.Y);
    }
    if (lb == null || rb == null) continue;
    //if output polygons share an Edge with a horizontal rb, they'll need joining later ...
    if (Op1 !== null && ClipperLib.ClipperBase.IsHorizontal(rb) && this.m_GhostJoins.length > 0 && rb.WindDelta !== 0)
    {
      for (var i = 0, ilen = this.m_GhostJoins.length; i < ilen; i++)
      {
        //if the horizontal Rb and a 'ghost' horizontal overlap, then convert
        //the 'ghost' join to a real join ready for later ...
        var j = this.m_GhostJoins[i];
        if (this.HorzSegmentsOverlap(j.OutPt1.Pt, j.OffPt, rb.Bot, rb.Top))
          this.AddJoin(j.OutPt1, Op1, j.OffPt);
      }
    }
    if (lb.OutIdx >= 0 && lb.PrevInAEL !== null &&
      lb.PrevInAEL.Curr.X == lb.Bot.X &&
      lb.PrevInAEL.OutIdx >= 0 &&
      ClipperLib.ClipperBase.SlopesEqual(lb.PrevInAEL, lb, this.m_UseFullRange) &&
      lb.WindDelta !== 0 && lb.PrevInAEL.WindDelta !== 0)
    {
      var Op2 = this.AddOutPt(lb.PrevInAEL, lb.Bot);
      this.AddJoin(Op1, Op2, lb.Top);
    }
    if (lb.NextInAEL != rb)
    {
      if (rb.OutIdx >= 0 && rb.PrevInAEL.OutIdx >= 0 &&
        ClipperLib.ClipperBase.SlopesEqual(rb.PrevInAEL, rb, this.m_UseFullRange) &&
        rb.WindDelta !== 0 && rb.PrevInAEL.WindDelta !== 0)
      {
        var Op2 = this.AddOutPt(rb.PrevInAEL, rb.Bot);
        this.AddJoin(Op1, Op2, rb.Top);
      }
      var e = lb.NextInAEL;
      if (e !== null)
        while (e != rb)
        {
          //nb: For calculating winding counts etc, IntersectEdges() assumes
          //that param1 will be to the right of param2 ABOVE the intersection ...
          this.IntersectEdges(rb, e, lb.Curr, false);
          //order important here
          e = e.NextInAEL;
        }
    }
  }
};
ClipperLib.Clipper.prototype.InsertEdgeIntoAEL = function (edge, startEdge)
{
  if (this.m_ActiveEdges === null)
  {
    edge.PrevInAEL = null;
    edge.NextInAEL = null;
    this.m_ActiveEdges = edge;
  }
  else if (startEdge === null && this.E2InsertsBeforeE1(this.m_ActiveEdges, edge))
  {
    edge.PrevInAEL = null;
    edge.NextInAEL = this.m_ActiveEdges;
    this.m_ActiveEdges.PrevInAEL = edge;
    this.m_ActiveEdges = edge;
  }
  else
  {
    if (startEdge === null)
      startEdge = this.m_ActiveEdges;
    while (startEdge.NextInAEL !== null && !this.E2InsertsBeforeE1(startEdge.NextInAEL, edge))
      startEdge = startEdge.NextInAEL;
    edge.NextInAEL = startEdge.NextInAEL;
    if (startEdge.NextInAEL !== null)
      startEdge.NextInAEL.PrevInAEL = edge;
    edge.PrevInAEL = startEdge;
    startEdge.NextInAEL = edge;
  }
};
ClipperLib.Clipper.prototype.E2InsertsBeforeE1 = function (e1, e2)
{
  if (e2.Curr.X == e1.Curr.X)
  {
    if (e2.Top.Y > e1.Top.Y)
      return e2.Top.X < ClipperLib.Clipper.TopX(e1, e2.Top.Y);
    else
      return e1.Top.X > ClipperLib.Clipper.TopX(e2, e1.Top.Y);
  }
  else
    return e2.Curr.X < e1.Curr.X;
};
ClipperLib.Clipper.prototype.IsEvenOddFillType = function (edge)
{
  if (edge.PolyTyp == ClipperLib.PolyType.ptSubject)
    return this.m_SubjFillType == ClipperLib.PolyFillType.pftEvenOdd;
  else
    return this.m_ClipFillType == ClipperLib.PolyFillType.pftEvenOdd;
};
ClipperLib.Clipper.prototype.IsEvenOddAltFillType = function (edge)
{
  if (edge.PolyTyp == ClipperLib.PolyType.ptSubject)
    return this.m_ClipFillType == ClipperLib.PolyFillType.pftEvenOdd;
  else
    return this.m_SubjFillType == ClipperLib.PolyFillType.pftEvenOdd;
};
ClipperLib.Clipper.prototype.IsContributing = function (edge)
{
  var pft, pft2;
  if (edge.PolyTyp == ClipperLib.PolyType.ptSubject)
  {
    pft = this.m_SubjFillType;
    pft2 = this.m_ClipFillType;
  }
  else
  {
    pft = this.m_ClipFillType;
    pft2 = this.m_SubjFillType;
  }
  switch (pft)
  {
  case ClipperLib.PolyFillType.pftEvenOdd:
    if (edge.WindDelta === 0 && edge.WindCnt != 1)
      return false;
    break;
  case ClipperLib.PolyFillType.pftNonZero:
    if (Math.abs(edge.WindCnt) != 1)
      return false;
    break;
  case ClipperLib.PolyFillType.pftPositive:
    if (edge.WindCnt != 1)
      return false;
    break;
  default:
    if (edge.WindCnt != -1)
      return false;
    break;
  }
  switch (this.m_ClipType)
  {
  case ClipperLib.ClipType.ctIntersection:
    switch (pft2)
    {
    case ClipperLib.PolyFillType.pftEvenOdd:
    case ClipperLib.PolyFillType.pftNonZero:
      return (edge.WindCnt2 !== 0);
    case ClipperLib.PolyFillType.pftPositive:
      return (edge.WindCnt2 > 0);
    default:
      return (edge.WindCnt2 < 0);
    }
  case ClipperLib.ClipType.ctUnion:
    switch (pft2)
    {
    case ClipperLib.PolyFillType.pftEvenOdd:
    case ClipperLib.PolyFillType.pftNonZero:
      return (edge.WindCnt2 === 0);
    case ClipperLib.PolyFillType.pftPositive:
      return (edge.WindCnt2 <= 0);
    default:
      return (edge.WindCnt2 >= 0);
    }
  case ClipperLib.ClipType.ctDifference:
    if (edge.PolyTyp == ClipperLib.PolyType.ptSubject)
      switch (pft2)
      {
      case ClipperLib.PolyFillType.pftEvenOdd:
      case ClipperLib.PolyFillType.pftNonZero:
        return (edge.WindCnt2 === 0);
      case ClipperLib.PolyFillType.pftPositive:
        return (edge.WindCnt2 <= 0);
      default:
        return (edge.WindCnt2 >= 0);
      }
    else
      switch (pft2)
      {
      case ClipperLib.PolyFillType.pftEvenOdd:
      case ClipperLib.PolyFillType.pftNonZero:
        return (edge.WindCnt2 !== 0);
      case ClipperLib.PolyFillType.pftPositive:
        return (edge.WindCnt2 > 0);
      default:
        return (edge.WindCnt2 < 0);
      }
  case ClipperLib.ClipType.ctXor:
    if (edge.WindDelta === 0)
      switch (pft2)
      {
      case ClipperLib.PolyFillType.pftEvenOdd:
      case ClipperLib.PolyFillType.pftNonZero:
        return (edge.WindCnt2 === 0);
      case ClipperLib.PolyFillType.pftPositive:
        return (edge.WindCnt2 <= 0);
      default:
        return (edge.WindCnt2 >= 0);
      }
    else
      return true;
  }
  return true;
};
ClipperLib.Clipper.prototype.SetWindingCount = function (edge)
{
  var e = edge.PrevInAEL;
  //find the edge of the same polytype that immediately preceeds 'edge' in AEL
  while (e !== null && ((e.PolyTyp != edge.PolyTyp) || (e.WindDelta === 0)))
    e = e.PrevInAEL;
  if (e === null)
  {
    edge.WindCnt = (edge.WindDelta === 0 ? 1 : edge.WindDelta);
    edge.WindCnt2 = 0;
    e = this.m_ActiveEdges;
    //ie get ready to calc WindCnt2
  }
  else if (edge.WindDelta === 0 && this.m_ClipType != ClipperLib.ClipType.ctUnion)
  {
    edge.WindCnt = 1;
    edge.WindCnt2 = e.WindCnt2;
    e = e.NextInAEL;
    //ie get ready to calc WindCnt2
  }
  else if (this.IsEvenOddFillType(edge))
  {
    //EvenOdd filling ...
    if (edge.WindDelta === 0)
    {
      //are we inside a subj polygon ...
      var Inside = true;
      var e2 = e.PrevInAEL;
      while (e2 !== null)
      {
        if (e2.PolyTyp == e.PolyTyp && e2.WindDelta !== 0)
          Inside = !Inside;
        e2 = e2.PrevInAEL;
      }
      edge.WindCnt = (Inside ? 0 : 1);
    }
    else
    {
      edge.WindCnt = edge.WindDelta;
    }
    edge.WindCnt2 = e.WindCnt2;
    e = e.NextInAEL;
    //ie get ready to calc WindCnt2
  }
  else
  {
    //nonZero, Positive or Negative filling ...
    if (e.WindCnt * e.WindDelta < 0)
    {
      //prev edge is 'decreasing' WindCount (WC) toward zero
      //so we're outside the previous polygon ...
      if (Math.abs(e.WindCnt) > 1)
      {
        //outside prev poly but still inside another.
        //when reversing direction of prev poly use the same WC 
        if (e.WindDelta * edge.WindDelta < 0)
          edge.WindCnt = e.WindCnt;
        else
          edge.WindCnt = e.WindCnt + edge.WindDelta;
      }
      else
        edge.WindCnt = (edge.WindDelta === 0 ? 1 : edge.WindDelta);
    }
    else
    {
      //prev edge is 'increasing' WindCount (WC) away from zero
      //so we're inside the previous polygon ...
      if (edge.WindDelta === 0)
        edge.WindCnt = (e.WindCnt < 0 ? e.WindCnt - 1 : e.WindCnt + 1);
      else if (e.WindDelta * edge.WindDelta < 0)
        edge.WindCnt = e.WindCnt;
      else
        edge.WindCnt = e.WindCnt + edge.WindDelta;
    }
    edge.WindCnt2 = e.WindCnt2;
    e = e.NextInAEL;
    //ie get ready to calc WindCnt2
  }
  //update WindCnt2 ...
  if (this.IsEvenOddAltFillType(edge))
  {
    //EvenOdd filling ...
    while (e != edge)
    {
      if (e.WindDelta !== 0)
        edge.WindCnt2 = (edge.WindCnt2 === 0 ? 1 : 0);
      e = e.NextInAEL;
    }
  }
  else
  {
    //nonZero, Positive or Negative filling ...
    while (e != edge)
    {
      edge.WindCnt2 += e.WindDelta;
      e = e.NextInAEL;
    }
  }
};
ClipperLib.Clipper.prototype.AddEdgeToSEL = function (edge)
{
  //SEL pointers in PEdge are reused to build a list of horizontal edges.
  //However, we don't need to worry about order with horizontal edge processing.
  if (this.m_SortedEdges === null)
  {
    this.m_SortedEdges = edge;
    edge.PrevInSEL = null;
    edge.NextInSEL = null;
  }
  else
  {
    edge.NextInSEL = this.m_SortedEdges;
    edge.PrevInSEL = null;
    this.m_SortedEdges.PrevInSEL = edge;
    this.m_SortedEdges = edge;
  }
};
ClipperLib.Clipper.prototype.CopyAELToSEL = function ()
{
  var e = this.m_ActiveEdges;
  this.m_SortedEdges = e;
  while (e !== null)
  {
    e.PrevInSEL = e.PrevInAEL;
    e.NextInSEL = e.NextInAEL;
    e = e.NextInAEL;
  }
};
ClipperLib.Clipper.prototype.SwapPositionsInAEL = function (edge1, edge2)
{
  //check that one or other edge hasn't already been removed from AEL ...
  if (edge1.NextInAEL == edge1.PrevInAEL || edge2.NextInAEL == edge2.PrevInAEL)
    return;
  if (edge1.NextInAEL == edge2)
  {
    var next = edge2.NextInAEL;
    if (next !== null)
      next.PrevInAEL = edge1;
    var prev = edge1.PrevInAEL;
    if (prev !== null)
      prev.NextInAEL = edge2;
    edge2.PrevInAEL = prev;
    edge2.NextInAEL = edge1;
    edge1.PrevInAEL = edge2;
    edge1.NextInAEL = next;
  }
  else if (edge2.NextInAEL == edge1)
  {
    var next = edge1.NextInAEL;
    if (next !== null)
      next.PrevInAEL = edge2;
    var prev = edge2.PrevInAEL;
    if (prev !== null)
      prev.NextInAEL = edge1;
    edge1.PrevInAEL = prev;
    edge1.NextInAEL = edge2;
    edge2.PrevInAEL = edge1;
    edge2.NextInAEL = next;
  }
  else
  {
    var next = edge1.NextInAEL;
    var prev = edge1.PrevInAEL;
    edge1.NextInAEL = edge2.NextInAEL;
    if (edge1.NextInAEL !== null)
      edge1.NextInAEL.PrevInAEL = edge1;
    edge1.PrevInAEL = edge2.PrevInAEL;
    if (edge1.PrevInAEL !== null)
      edge1.PrevInAEL.NextInAEL = edge1;
    edge2.NextInAEL = next;
    if (edge2.NextInAEL !== null)
      edge2.NextInAEL.PrevInAEL = edge2;
    edge2.PrevInAEL = prev;
    if (edge2.PrevInAEL !== null)
      edge2.PrevInAEL.NextInAEL = edge2;
  }
  if (edge1.PrevInAEL === null)
    this.m_ActiveEdges = edge1;
  else if (edge2.PrevInAEL === null)
    this.m_ActiveEdges = edge2;
};
ClipperLib.Clipper.prototype.SwapPositionsInSEL = function (edge1, edge2)
{
  if (edge1.NextInSEL === null && edge1.PrevInSEL === null)
    return;
  if (edge2.NextInSEL === null && edge2.PrevInSEL === null)
    return;
  if (edge1.NextInSEL == edge2)
  {
    var next = edge2.NextInSEL;
    if (next !== null)
      next.PrevInSEL = edge1;
    var prev = edge1.PrevInSEL;
    if (prev !== null)
      prev.NextInSEL = edge2;
    edge2.PrevInSEL = prev;
    edge2.NextInSEL = edge1;
    edge1.PrevInSEL = edge2;
    edge1.NextInSEL = next;
  }
  else if (edge2.NextInSEL == edge1)
  {
    var next = edge1.NextInSEL;
    if (next !== null)
      next.PrevInSEL = edge2;
    var prev = edge2.PrevInSEL;
    if (prev !== null)
      prev.NextInSEL = edge1;
    edge1.PrevInSEL = prev;
    edge1.NextInSEL = edge2;
    edge2.PrevInSEL = edge1;
    edge2.NextInSEL = next;
  }
  else
  {
    var next = edge1.NextInSEL;
    var prev = edge1.PrevInSEL;
    edge1.NextInSEL = edge2.NextInSEL;
    if (edge1.NextInSEL !== null)
      edge1.NextInSEL.PrevInSEL = edge1;
    edge1.PrevInSEL = edge2.PrevInSEL;
    if (edge1.PrevInSEL !== null)
      edge1.PrevInSEL.NextInSEL = edge1;
    edge2.NextInSEL = next;
    if (edge2.NextInSEL !== null)
      edge2.NextInSEL.PrevInSEL = edge2;
    edge2.PrevInSEL = prev;
    if (edge2.PrevInSEL !== null)
      edge2.PrevInSEL.NextInSEL = edge2;
  }
  if (edge1.PrevInSEL === null)
    this.m_SortedEdges = edge1;
  else if (edge2.PrevInSEL === null)
    this.m_SortedEdges = edge2;
};
ClipperLib.Clipper.prototype.AddLocalMaxPoly = function (e1, e2, pt)
{
  this.AddOutPt(e1, pt);
  if (e2.WindDelta == 0) this.AddOutPt(e2, pt);
  if (e1.OutIdx == e2.OutIdx)
  {
    e1.OutIdx = -1;
    e2.OutIdx = -1;
  }
  else if (e1.OutIdx < e2.OutIdx)
    this.AppendPolygon(e1, e2);
  else
    this.AppendPolygon(e2, e1);
};
ClipperLib.Clipper.prototype.AddLocalMinPoly = function (e1, e2, pt)
{
  var result;
  var e, prevE;
  if (ClipperLib.ClipperBase.IsHorizontal(e2) || (e1.Dx > e2.Dx))
  {
    result = this.AddOutPt(e1, pt);
    e2.OutIdx = e1.OutIdx;
    e1.Side = ClipperLib.EdgeSide.esLeft;
    e2.Side = ClipperLib.EdgeSide.esRight;
    e = e1;
    if (e.PrevInAEL == e2)
      prevE = e2.PrevInAEL;
    else
      prevE = e.PrevInAEL;
  }
  else
  {
    result = this.AddOutPt(e2, pt);
    e1.OutIdx = e2.OutIdx;
    e1.Side = ClipperLib.EdgeSide.esRight;
    e2.Side = ClipperLib.EdgeSide.esLeft;
    e = e2;
    if (e.PrevInAEL == e1)
      prevE = e1.PrevInAEL;
    else
      prevE = e.PrevInAEL;
  }
  if (prevE !== null && prevE.OutIdx >= 0 && (ClipperLib.Clipper.TopX(prevE, pt.Y) == ClipperLib.Clipper.TopX(e, pt.Y)) && ClipperLib.ClipperBase.SlopesEqual(e, prevE, this.m_UseFullRange) && (e.WindDelta !== 0) && (prevE.WindDelta !== 0))
  {
    var outPt = this.AddOutPt(prevE, pt);
    this.AddJoin(result, outPt, e.Top);
  }
  return result;
};
ClipperLib.Clipper.prototype.CreateOutRec = function ()
{
  var result = new ClipperLib.OutRec();
  result.Idx = -1;
  result.IsHole = false;
  result.IsOpen = false;
  result.FirstLeft = null;
  result.Pts = null;
  result.BottomPt = null;
  result.PolyNode = null;
  this.m_PolyOuts.push(result);
  result.Idx = this.m_PolyOuts.length - 1;
  return result;
};
ClipperLib.Clipper.prototype.AddOutPt = function (e, pt)
{
  var ToFront = (e.Side == ClipperLib.EdgeSide.esLeft);
  if (e.OutIdx < 0)
  {
    var outRec = this.CreateOutRec();
    outRec.IsOpen = (e.WindDelta === 0);
    var newOp = new ClipperLib.OutPt();
    outRec.Pts = newOp;
    newOp.Idx = outRec.Idx;
    //newOp.Pt = pt;
    newOp.Pt.X = pt.X;
    newOp.Pt.Y = pt.Y;
    newOp.Next = newOp;
    newOp.Prev = newOp;
    if (!outRec.IsOpen)
      this.SetHoleState(e, outRec);
    if (use_xyz)
    {
      if (ClipperLib.IntPoint.op_Equality(pt, e.Bot))
      {
        //newOp.Pt = e.Bot;
        newOp.Pt.X = e.Bot.X;
        newOp.Pt.Y = e.Bot.Y;
        newOp.Pt.Z = e.Bot.Z;
      }
      else if (ClipperLib.IntPoint.op_Equality(pt, e.Top))
      {
        //newOp.Pt = e.Top;
        newOp.Pt.X = e.Top.X;
        newOp.Pt.Y = e.Top.Y;
        newOp.Pt.Z = e.Top.Z;
      }
      else
        this.SetZ(newOp.Pt, e);
    }
    e.OutIdx = outRec.Idx;
    //nb: do this after SetZ !
    return newOp;
  }
  else
  {
    var outRec = this.m_PolyOuts[e.OutIdx];
    //OutRec.Pts is the 'Left-most' point & OutRec.Pts.Prev is the 'Right-most'
    var op = outRec.Pts;
    if (ToFront && ClipperLib.IntPoint.op_Equality(pt, op.Pt))
      return op;
    else if (!ToFront && ClipperLib.IntPoint.op_Equality(pt, op.Prev.Pt))
      return op.Prev;
    var newOp = new ClipperLib.OutPt();
    newOp.Idx = outRec.Idx;
    //newOp.Pt = pt;
    newOp.Pt.X = pt.X;
    newOp.Pt.Y = pt.Y;
    newOp.Next = op;
    newOp.Prev = op.Prev;
    newOp.Prev.Next = newOp;
    op.Prev = newOp;
    if (ToFront)
      outRec.Pts = newOp;
    if (use_xyz)
    {
      if (ClipperLib.IntPoint.op_Equality(pt, e.Bot))
      {
        //newOp.Pt = e.Bot;
        newOp.Pt.X = e.Bot.X;
        newOp.Pt.Y = e.Bot.Y;
        newOp.Pt.Z = e.Bot.Z;
      }
      else if (ClipperLib.IntPoint.op_Equality(pt, e.Top))
      {
        //newOp.Pt = e.Top;
        newOp.Pt.X = e.Top.X;
        newOp.Pt.Y = e.Top.Y;
        newOp.Pt.Z = e.Top.Z;
      }
      else
        this.SetZ(newOp.Pt, e);
    }
    return newOp;
  }
};
ClipperLib.Clipper.prototype.SwapPoints = function (pt1, pt2)
{
  var tmp = new ClipperLib.IntPoint(pt1.Value);
  //pt1.Value = pt2.Value;
  pt1.Value.X = pt2.Value.X;
  pt1.Value.Y = pt2.Value.Y;
  //pt2.Value = tmp;
  pt2.Value.X = tmp.X;
  pt2.Value.Y = tmp.Y;
};
ClipperLib.Clipper.prototype.HorzSegmentsOverlap = function (Pt1a, Pt1b, Pt2a, Pt2b)
{
  //precondition: both segments are horizontal
  if ((Pt1a.X > Pt2a.X) == (Pt1a.X < Pt2b.X))
    return true;
  else if ((Pt1b.X > Pt2a.X) == (Pt1b.X < Pt2b.X))
    return true;
  else if ((Pt2a.X > Pt1a.X) == (Pt2a.X < Pt1b.X))
    return true;
  else if ((Pt2b.X > Pt1a.X) == (Pt2b.X < Pt1b.X))
    return true;
  else if ((Pt1a.X == Pt2a.X) && (Pt1b.X == Pt2b.X))
    return true;
  else if ((Pt1a.X == Pt2b.X) && (Pt1b.X == Pt2a.X))
    return true;
  else
    return false;
};
ClipperLib.Clipper.prototype.InsertPolyPtBetween = function (p1, p2, pt)
{
  var result = new ClipperLib.OutPt();
  //result.Pt = pt;
  result.Pt.X = pt.X;
  result.Pt.Y = pt.Y;
  if (p2 == p1.Next)
  {
    p1.Next = result;
    p2.Prev = result;
    result.Next = p2;
    result.Prev = p1;
  }
  else
  {
    p2.Next = result;
    p1.Prev = result;
    result.Next = p1;
    result.Prev = p2;
  }
  return result;
};
ClipperLib.Clipper.prototype.SetHoleState = function (e, outRec)
{
  var isHole = false;
  var e2 = e.PrevInAEL;
  while (e2 !== null)
  {
    if (e2.OutIdx >= 0 && e2.WindDelta != 0)
    {
      isHole = !isHole;
      if (outRec.FirstLeft === null)
        outRec.FirstLeft = this.m_PolyOuts[e2.OutIdx];
    }
    e2 = e2.PrevInAEL;
  }
  if (isHole)
    outRec.IsHole = true;
};
ClipperLib.Clipper.prototype.GetDx = function (pt1, pt2)
{
  if (pt1.Y == pt2.Y)
    return ClipperLib.ClipperBase.horizontal;
  else
    return (pt2.X - pt1.X) / (pt2.Y - pt1.Y);
};
ClipperLib.Clipper.prototype.FirstIsBottomPt = function (btmPt1, btmPt2)
{
  var p = btmPt1.Prev;
  while ((ClipperLib.IntPoint.op_Equality(p.Pt, btmPt1.Pt)) && (p != btmPt1))
    p = p.Prev;
  var dx1p = Math.abs(this.GetDx(btmPt1.Pt, p.Pt));
  p = btmPt1.Next;
  while ((ClipperLib.IntPoint.op_Equality(p.Pt, btmPt1.Pt)) && (p != btmPt1))
    p = p.Next;
  var dx1n = Math.abs(this.GetDx(btmPt1.Pt, p.Pt));
  p = btmPt2.Prev;
  while ((ClipperLib.IntPoint.op_Equality(p.Pt, btmPt2.Pt)) && (p != btmPt2))
    p = p.Prev;
  var dx2p = Math.abs(this.GetDx(btmPt2.Pt, p.Pt));
  p = btmPt2.Next;
  while ((ClipperLib.IntPoint.op_Equality(p.Pt, btmPt2.Pt)) && (p != btmPt2))
    p = p.Next;
  var dx2n = Math.abs(this.GetDx(btmPt2.Pt, p.Pt));
  return (dx1p >= dx2p && dx1p >= dx2n) || (dx1n >= dx2p && dx1n >= dx2n);
};
ClipperLib.Clipper.prototype.GetBottomPt = function (pp)
{
  var dups = null;
  var p = pp.Next;
  while (p != pp)
  {
    if (p.Pt.Y > pp.Pt.Y)
    {
      pp = p;
      dups = null;
    }
    else if (p.Pt.Y == pp.Pt.Y && p.Pt.X <= pp.Pt.X)
    {
      if (p.Pt.X < pp.Pt.X)
      {
        dups = null;
        pp = p;
      }
      else
      {
        if (p.Next != pp && p.Prev != pp)
          dups = p;
      }
    }
    p = p.Next;
  }
  if (dups !== null)
  {
    //there appears to be at least 2 vertices at bottomPt so ...
    while (dups != p)
    {
      if (!this.FirstIsBottomPt(p, dups))
        pp = dups;
      dups = dups.Next;
      while (ClipperLib.IntPoint.op_Inequality(dups.Pt, pp.Pt))
        dups = dups.Next;
    }
  }
  return pp;
};
ClipperLib.Clipper.prototype.GetLowermostRec = function (outRec1, outRec2)
{
  //work out which polygon fragment has the correct hole state ...
  if (outRec1.BottomPt === null)
    outRec1.BottomPt = this.GetBottomPt(outRec1.Pts);
  if (outRec2.BottomPt === null)
    outRec2.BottomPt = this.GetBottomPt(outRec2.Pts);
  var bPt1 = outRec1.BottomPt;
  var bPt2 = outRec2.BottomPt;
  if (bPt1.Pt.Y > bPt2.Pt.Y)
    return outRec1;
  else if (bPt1.Pt.Y < bPt2.Pt.Y)
    return outRec2;
  else if (bPt1.Pt.X < bPt2.Pt.X)
    return outRec1;
  else if (bPt1.Pt.X > bPt2.Pt.X)
    return outRec2;
  else if (bPt1.Next == bPt1)
    return outRec2;
  else if (bPt2.Next == bPt2)
    return outRec1;
  else if (this.FirstIsBottomPt(bPt1, bPt2))
    return outRec1;
  else
    return outRec2;
};
ClipperLib.Clipper.prototype.Param1RightOfParam2 = function (outRec1, outRec2)
{
  do {
    outRec1 = outRec1.FirstLeft;
    if (outRec1 == outRec2)
      return true;
  }
  while (outRec1 !== null)
  return false;
};
ClipperLib.Clipper.prototype.GetOutRec = function (idx)
{
  var outrec = this.m_PolyOuts[idx];
  while (outrec != this.m_PolyOuts[outrec.Idx])
    outrec = this.m_PolyOuts[outrec.Idx];
  return outrec;
};
ClipperLib.Clipper.prototype.AppendPolygon = function (e1, e2)
{
  //get the start and ends of both output polygons ...
  var outRec1 = this.m_PolyOuts[e1.OutIdx];
  var outRec2 = this.m_PolyOuts[e2.OutIdx];
  var holeStateRec;
  if (this.Param1RightOfParam2(outRec1, outRec2))
    holeStateRec = outRec2;
  else if (this.Param1RightOfParam2(outRec2, outRec1))
    holeStateRec = outRec1;
  else
    holeStateRec = this.GetLowermostRec(outRec1, outRec2);
  var p1_lft = outRec1.Pts;
  var p1_rt = p1_lft.Prev;
  var p2_lft = outRec2.Pts;
  var p2_rt = p2_lft.Prev;
  var side;
  //join e2 poly onto e1 poly and delete pointers to e2 ...
  if (e1.Side == ClipperLib.EdgeSide.esLeft)
  {
    if (e2.Side == ClipperLib.EdgeSide.esLeft)
    {
      //z y x a b c
      this.ReversePolyPtLinks(p2_lft);
      p2_lft.Next = p1_lft;
      p1_lft.Prev = p2_lft;
      p1_rt.Next = p2_rt;
      p2_rt.Prev = p1_rt;
      outRec1.Pts = p2_rt;
    }
    else
    {
      //x y z a b c
      p2_rt.Next = p1_lft;
      p1_lft.Prev = p2_rt;
      p2_lft.Prev = p1_rt;
      p1_rt.Next = p2_lft;
      outRec1.Pts = p2_lft;
    }
    side = ClipperLib.EdgeSide.esLeft;
  }
  else
  {
    if (e2.Side == ClipperLib.EdgeSide.esRight)
    {
      //a b c z y x
      this.ReversePolyPtLinks(p2_lft);
      p1_rt.Next = p2_rt;
      p2_rt.Prev = p1_rt;
      p2_lft.Next = p1_lft;
      p1_lft.Prev = p2_lft;
    }
    else
    {
      //a b c x y z
      p1_rt.Next = p2_lft;
      p2_lft.Prev = p1_rt;
      p1_lft.Prev = p2_rt;
      p2_rt.Next = p1_lft;
    }
    side = ClipperLib.EdgeSide.esRight;
  }
  outRec1.BottomPt = null;
  if (holeStateRec == outRec2)
  {
    if (outRec2.FirstLeft != outRec1)
      outRec1.FirstLeft = outRec2.FirstLeft;
    outRec1.IsHole = outRec2.IsHole;
  }
  outRec2.Pts = null;
  outRec2.BottomPt = null;
  outRec2.FirstLeft = outRec1;
  var OKIdx = e1.OutIdx;
  var ObsoleteIdx = e2.OutIdx;
  e1.OutIdx = -1;
  //nb: safe because we only get here via AddLocalMaxPoly
  e2.OutIdx = -1;
  var e = this.m_ActiveEdges;
  while (e !== null)
  {
    if (e.OutIdx == ObsoleteIdx)
    {
      e.OutIdx = OKIdx;
      e.Side = side;
      break;
    }
    e = e.NextInAEL;
  }
  outRec2.Idx = outRec1.Idx;
};
ClipperLib.Clipper.prototype.ReversePolyPtLinks = function (pp)
{
  if (pp === null)
    return;
  var pp1;
  var pp2;
  pp1 = pp;
  do {
    pp2 = pp1.Next;
    pp1.Next = pp1.Prev;
    pp1.Prev = pp2;
    pp1 = pp2;
  }
  while (pp1 != pp)
};
ClipperLib.Clipper.SwapSides = function (edge1, edge2)
{
  var side = edge1.Side;
  edge1.Side = edge2.Side;
  edge2.Side = side;
};
ClipperLib.Clipper.SwapPolyIndexes = function (edge1, edge2)
{
  var outIdx = edge1.OutIdx;
  edge1.OutIdx = edge2.OutIdx;
  edge2.OutIdx = outIdx;
};
ClipperLib.Clipper.prototype.IntersectEdges = function (e1, e2, pt, protect)
{
  //e1 will be to the left of e2 BELOW the intersection. Therefore e1 is before
  //e2 in AEL except when e1 is being inserted at the intersection point ...
  var e1stops = !protect && e1.NextInLML === null &&
    e1.Top.X == pt.X && e1.Top.Y == pt.Y;
  var e2stops = !protect && e2.NextInLML === null &&
    e2.Top.X == pt.X && e2.Top.Y == pt.Y;
  var e1Contributing = (e1.OutIdx >= 0);
  var e2Contributing = (e2.OutIdx >= 0);
  if (use_lines)
  {
    //if either edge is on an OPEN path ...
    if (e1.WindDelta === 0 || e2.WindDelta === 0)
    {
      //ignore subject-subject open path intersections UNLESS they
      //are both open paths, AND they are both 'contributing maximas' ...
      if (e1.WindDelta === 0 && e2.WindDelta === 0)
      {
        if ((e1stops || e2stops) && e1Contributing && e2Contributing)
          this.AddLocalMaxPoly(e1, e2, pt);
      }
      //if intersecting a subj line with a subj poly ...
      else if (e1.PolyTyp == e2.PolyTyp &&
        e1.WindDelta != e2.WindDelta && this.m_ClipType == ClipperLib.ClipType.ctUnion)
      {
        if (e1.WindDelta === 0)
        {
          if (e2Contributing)
          {
            this.AddOutPt(e1, pt);
            if (e1Contributing)
              e1.OutIdx = -1;
          }
        }
        else
        {
          if (e1Contributing)
          {
            this.AddOutPt(e2, pt);
            if (e2Contributing)
              e2.OutIdx = -1;
          }
        }
      }
      else if (e1.PolyTyp != e2.PolyTyp)
      {
        if ((e1.WindDelta === 0) && Math.abs(e2.WindCnt) == 1 &&
          (this.m_ClipType != ClipperLib.ClipType.ctUnion || e2.WindCnt2 === 0))
        {
          this.AddOutPt(e1, pt);
          if (e1Contributing)
            e1.OutIdx = -1;
        }
        else if ((e2.WindDelta === 0) && (Math.abs(e1.WindCnt) == 1) &&
          (this.m_ClipType != ClipperLib.ClipType.ctUnion || e1.WindCnt2 === 0))
        {
          this.AddOutPt(e2, pt);
          if (e2Contributing)
            e2.OutIdx = -1;
        }
      }
      if (e1stops)
        if (e1.OutIdx < 0)
          this.DeleteFromAEL(e1);
        else
          ClipperLib.Error("Error intersecting polylines");
      if (e2stops)
        if (e2.OutIdx < 0)
          this.DeleteFromAEL(e2);
        else
          ClipperLib.Error("Error intersecting polylines");
      return;
    }
  }
  //update winding counts...
  //assumes that e1 will be to the Right of e2 ABOVE the intersection
  if (e1.PolyTyp == e2.PolyTyp)
  {
    if (this.IsEvenOddFillType(e1))
    {
      var oldE1WindCnt = e1.WindCnt;
      e1.WindCnt = e2.WindCnt;
      e2.WindCnt = oldE1WindCnt;
    }
    else
    {
      if (e1.WindCnt + e2.WindDelta === 0)
        e1.WindCnt = -e1.WindCnt;
      else
        e1.WindCnt += e2.WindDelta;
      if (e2.WindCnt - e1.WindDelta === 0)
        e2.WindCnt = -e2.WindCnt;
      else
        e2.WindCnt -= e1.WindDelta;
    }
  }
  else
  {
    if (!this.IsEvenOddFillType(e2))
      e1.WindCnt2 += e2.WindDelta;
    else
      e1.WindCnt2 = (e1.WindCnt2 === 0) ? 1 : 0;
    if (!this.IsEvenOddFillType(e1))
      e2.WindCnt2 -= e1.WindDelta;
    else
      e2.WindCnt2 = (e2.WindCnt2 === 0) ? 1 : 0;
  }
  var e1FillType, e2FillType, e1FillType2, e2FillType2;
  if (e1.PolyTyp == ClipperLib.PolyType.ptSubject)
  {
    e1FillType = this.m_SubjFillType;
    e1FillType2 = this.m_ClipFillType;
  }
  else
  {
    e1FillType = this.m_ClipFillType;
    e1FillType2 = this.m_SubjFillType;
  }
  if (e2.PolyTyp == ClipperLib.PolyType.ptSubject)
  {
    e2FillType = this.m_SubjFillType;
    e2FillType2 = this.m_ClipFillType;
  }
  else
  {
    e2FillType = this.m_ClipFillType;
    e2FillType2 = this.m_SubjFillType;
  }
  var e1Wc, e2Wc;
  switch (e1FillType)
  {
  case ClipperLib.PolyFillType.pftPositive:
    e1Wc = e1.WindCnt;
    break;
  case ClipperLib.PolyFillType.pftNegative:
    e1Wc = -e1.WindCnt;
    break;
  default:
    e1Wc = Math.abs(e1.WindCnt);
    break;
  }
  switch (e2FillType)
  {
  case ClipperLib.PolyFillType.pftPositive:
    e2Wc = e2.WindCnt;
    break;
  case ClipperLib.PolyFillType.pftNegative:
    e2Wc = -e2.WindCnt;
    break;
  default:
    e2Wc = Math.abs(e2.WindCnt);
    break;
  }
  if (e1Contributing && e2Contributing)
  {
    if (e1stops || e2stops || (e1Wc !== 0 && e1Wc != 1) || (e2Wc !== 0 && e2Wc != 1) ||
      (e1.PolyTyp != e2.PolyTyp && this.m_ClipType != ClipperLib.ClipType.ctXor))
      this.AddLocalMaxPoly(e1, e2, pt);
    else
    {
      this.AddOutPt(e1, pt);
      this.AddOutPt(e2, pt);
      ClipperLib.Clipper.SwapSides(e1, e2);
      ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
    }
  }
  else if (e1Contributing)
  {
    if (e2Wc === 0 || e2Wc == 1)
    {
      this.AddOutPt(e1, pt);
      ClipperLib.Clipper.SwapSides(e1, e2);
      ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
    }
  }
  else if (e2Contributing)
  {
    if (e1Wc === 0 || e1Wc == 1)
    {
      this.AddOutPt(e2, pt);
      ClipperLib.Clipper.SwapSides(e1, e2);
      ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
    }
  }
  else if ((e1Wc === 0 || e1Wc == 1) &&
    (e2Wc === 0 || e2Wc == 1) && !e1stops && !e2stops)
  {
    //neither edge is currently contributing ...
    var e1Wc2, e2Wc2;
    switch (e1FillType2)
    {
    case ClipperLib.PolyFillType.pftPositive:
      e1Wc2 = e1.WindCnt2;
      break;
    case ClipperLib.PolyFillType.pftNegative:
      e1Wc2 = -e1.WindCnt2;
      break;
    default:
      e1Wc2 = Math.abs(e1.WindCnt2);
      break;
    }
    switch (e2FillType2)
    {
    case ClipperLib.PolyFillType.pftPositive:
      e2Wc2 = e2.WindCnt2;
      break;
    case ClipperLib.PolyFillType.pftNegative:
      e2Wc2 = -e2.WindCnt2;
      break;
    default:
      e2Wc2 = Math.abs(e2.WindCnt2);
      break;
    }
    if (e1.PolyTyp != e2.PolyTyp)
      this.AddLocalMinPoly(e1, e2, pt);
    else if (e1Wc == 1 && e2Wc == 1)
      switch (this.m_ClipType)
      {
      case ClipperLib.ClipType.ctIntersection:
        if (e1Wc2 > 0 && e2Wc2 > 0)
          this.AddLocalMinPoly(e1, e2, pt);
        break;
      case ClipperLib.ClipType.ctUnion:
        if (e1Wc2 <= 0 && e2Wc2 <= 0)
          this.AddLocalMinPoly(e1, e2, pt);
        break;
      case ClipperLib.ClipType.ctDifference:
        if (((e1.PolyTyp == ClipperLib.PolyType.ptClip) && (e1Wc2 > 0) && (e2Wc2 > 0)) ||
          ((e1.PolyTyp == ClipperLib.PolyType.ptSubject) && (e1Wc2 <= 0) && (e2Wc2 <= 0)))
          this.AddLocalMinPoly(e1, e2, pt);
        break;
      case ClipperLib.ClipType.ctXor:
        this.AddLocalMinPoly(e1, e2, pt);
        break;
      }
    else
      ClipperLib.Clipper.SwapSides(e1, e2);
  }
  if ((e1stops != e2stops) &&
    ((e1stops && (e1.OutIdx >= 0)) || (e2stops && (e2.OutIdx >= 0))))
  {
    ClipperLib.Clipper.SwapSides(e1, e2);
    ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
  }
  //finally, delete any non-contributing maxima edges  ...
  if (e1stops)
    this.DeleteFromAEL(e1);
  if (e2stops)
    this.DeleteFromAEL(e2);
};
ClipperLib.Clipper.prototype.DeleteFromAEL = function (e)
{
  var AelPrev = e.PrevInAEL;
  var AelNext = e.NextInAEL;
  if (AelPrev === null && AelNext === null && (e != this.m_ActiveEdges))
    return;
  //already deleted
  if (AelPrev !== null)
    AelPrev.NextInAEL = AelNext;
  else
    this.m_ActiveEdges = AelNext;
  if (AelNext !== null)
    AelNext.PrevInAEL = AelPrev;
  e.NextInAEL = null;
  e.PrevInAEL = null;
};
ClipperLib.Clipper.prototype.DeleteFromSEL = function (e)
{
  var SelPrev = e.PrevInSEL;
  var SelNext = e.NextInSEL;
  if (SelPrev === null && SelNext === null && (e != this.m_SortedEdges))
    return;
  //already deleted
  if (SelPrev !== null)
    SelPrev.NextInSEL = SelNext;
  else
    this.m_SortedEdges = SelNext;
  if (SelNext !== null)
    SelNext.PrevInSEL = SelPrev;
  e.NextInSEL = null;
  e.PrevInSEL = null;
};
ClipperLib.Clipper.prototype.UpdateEdgeIntoAEL = function (e)
{
  if (e.NextInLML === null)
    ClipperLib.Error("UpdateEdgeIntoAEL: invalid call");
  var AelPrev = e.PrevInAEL;
  var AelNext = e.NextInAEL;
  e.NextInLML.OutIdx = e.OutIdx;
  if (AelPrev !== null)
    AelPrev.NextInAEL = e.NextInLML;
  else
    this.m_ActiveEdges = e.NextInLML;
  if (AelNext !== null)
    AelNext.PrevInAEL = e.NextInLML;
  e.NextInLML.Side = e.Side;
  e.NextInLML.WindDelta = e.WindDelta;
  e.NextInLML.WindCnt = e.WindCnt;
  e.NextInLML.WindCnt2 = e.WindCnt2;
  e = e.NextInLML;
  //    e.Curr = e.Bot;
  e.Curr.X = e.Bot.X;
  e.Curr.Y = e.Bot.Y;
  e.PrevInAEL = AelPrev;
  e.NextInAEL = AelNext;
  if (!ClipperLib.ClipperBase.IsHorizontal(e))
    this.InsertScanbeam(e.Top.Y);
  return e;
};
ClipperLib.Clipper.prototype.ProcessHorizontals = function (isTopOfScanbeam)
{
  var horzEdge = this.m_SortedEdges;
  while (horzEdge !== null)
  {
    this.DeleteFromSEL(horzEdge);
    this.ProcessHorizontal(horzEdge, isTopOfScanbeam);
    horzEdge = this.m_SortedEdges;
  }
};
ClipperLib.Clipper.prototype.GetHorzDirection = function (HorzEdge, $var)
{
  if (HorzEdge.Bot.X < HorzEdge.Top.X)
  {
      $var.Left = HorzEdge.Bot.X;
      $var.Right = HorzEdge.Top.X;
      $var.Dir = ClipperLib.Direction.dLeftToRight;
  }
  else
  {
      $var.Left = HorzEdge.Top.X;
      $var.Right = HorzEdge.Bot.X;
      $var.Dir = ClipperLib.Direction.dRightToLeft;
  }
};
ClipperLib.Clipper.prototype.PrepareHorzJoins = function (horzEdge, isTopOfScanbeam)
{
  //get the last Op for this horizontal edge
  //the point may be anywhere along the horizontal ...
  var outPt = this.m_PolyOuts[horzEdge.OutIdx].Pts;
  if (horzEdge.Side != ClipperLib.EdgeSide.esLeft)
    outPt = outPt.Prev;
  //First, match up overlapping horizontal edges (eg when one polygon's
  //intermediate horz edge overlaps an intermediate horz edge of another, or
  //when one polygon sits on top of another) ...
  //for (var i = 0, ilen = this.m_GhostJoins.length; i < ilen; ++i) {
  //  var j = this.m_GhostJoins[i];
  //  if (this.HorzSegmentsOverlap(j.OutPt1.Pt, j.OffPt, horzEdge.Bot, horzEdge.Top))
  //    this.AddJoin(j.OutPt1, outPt, j.OffPt);
  //}

  //Also, since horizontal edges at the top of one SB are often removed from
  //the AEL before we process the horizontal edges at the bottom of the next,
  //we need to create 'ghost' Join records of 'contrubuting' horizontals that
  //we can compare with horizontals at the bottom of the next SB.
  if (isTopOfScanbeam)
    if (ClipperLib.IntPoint.op_Equality(outPt.Pt, horzEdge.Top))
      this.AddGhostJoin(outPt, horzEdge.Bot);
    else
      this.AddGhostJoin(outPt, horzEdge.Top);
};
ClipperLib.Clipper.prototype.ProcessHorizontal = function (horzEdge, isTopOfScanbeam)
{
  var $var = {Dir: null, Left: null, Right: null};
  this.GetHorzDirection(horzEdge, $var);
  var dir = $var.Dir;
  var horzLeft = $var.Left;
  var horzRight = $var.Right;

  var eLastHorz = horzEdge,
    eMaxPair = null;
  while (eLastHorz.NextInLML !== null && ClipperLib.ClipperBase.IsHorizontal(eLastHorz.NextInLML))
    eLastHorz = eLastHorz.NextInLML;
  if (eLastHorz.NextInLML === null)
    eMaxPair = this.GetMaximaPair(eLastHorz);
  for (;;)
  {
    var IsLastHorz = (horzEdge == eLastHorz);
    var e = this.GetNextInAEL(horzEdge, dir);
    while (e !== null)
    {
      //Break if we've got to the end of an intermediate horizontal edge ...
      //nb: Smaller Dx's are to the right of larger Dx's ABOVE the horizontal.
      if (e.Curr.X == horzEdge.Top.X && horzEdge.NextInLML !== null && e.Dx < horzEdge.NextInLML.Dx)
        break;
      var eNext = this.GetNextInAEL(e, dir);
      //saves eNext for later
      if ((dir == ClipperLib.Direction.dLeftToRight && e.Curr.X <= horzRight) || (dir == ClipperLib.Direction.dRightToLeft && e.Curr.X >= horzLeft))
      {

        if (horzEdge.OutIdx >= 0 && horzEdge.WindDelta != 0)
          this.PrepareHorzJoins(horzEdge, isTopOfScanbeam);

        //so far we're still in range of the horizontal Edge  but make sure
        //we're at the last of consec. horizontals when matching with eMaxPair
        if (e == eMaxPair && IsLastHorz)
        {
          if (dir == ClipperLib.Direction.dLeftToRight)
            this.IntersectEdges(horzEdge, e, e.Top, false);
          else
            this.IntersectEdges(e, horzEdge, e.Top, false);
          if (eMaxPair.OutIdx >= 0)
            ClipperLib.Error("ProcessHorizontal error");
          return;
        }
        else if (dir == ClipperLib.Direction.dLeftToRight)
        {
          var Pt = new ClipperLib.IntPoint(e.Curr.X, horzEdge.Curr.Y);
          this.IntersectEdges(horzEdge, e, Pt, true);
        }
        else
        {
          var Pt = new ClipperLib.IntPoint(e.Curr.X, horzEdge.Curr.Y);
          this.IntersectEdges(e, horzEdge, Pt, true);
        }
        this.SwapPositionsInAEL(horzEdge, e);
      }
      else if ((dir == ClipperLib.Direction.dLeftToRight && e.Curr.X >= horzRight) || (dir == ClipperLib.Direction.dRightToLeft && e.Curr.X <= horzLeft))
        break;
      e = eNext;
    }
    //end while
    if (horzEdge.OutIdx >= 0 && horzEdge.WindDelta !== 0)
      this.PrepareHorzJoins(horzEdge, isTopOfScanbeam);
    if (horzEdge.NextInLML !== null && ClipperLib.ClipperBase.IsHorizontal(horzEdge.NextInLML))
    {
      horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
      if (horzEdge.OutIdx >= 0)
        this.AddOutPt(horzEdge, horzEdge.Bot);
        
        var $var = {Dir: dir, Left: horzLeft, Right: horzRight};
        this.GetHorzDirection(horzEdge, $var);
        dir = $var.Dir;
        horzLeft = $var.Left;
        horzRight = $var.Right;
    }
    else
      break;
  }
  //end for (;;)
  if (horzEdge.NextInLML !== null)
  {
    if (horzEdge.OutIdx >= 0)
    {
      var op1 = this.AddOutPt(horzEdge, horzEdge.Top);
      horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
      if (horzEdge.WindDelta === 0)
        return;
      //nb: HorzEdge is no longer horizontal here
      var ePrev = horzEdge.PrevInAEL;
      var eNext = horzEdge.NextInAEL;
      if (ePrev !== null && ePrev.Curr.X == horzEdge.Bot.X &&
        ePrev.Curr.Y == horzEdge.Bot.Y && ePrev.WindDelta !== 0 &&
        (ePrev.OutIdx >= 0 && ePrev.Curr.Y > ePrev.Top.Y &&
          ClipperLib.ClipperBase.SlopesEqual(horzEdge, ePrev, this.m_UseFullRange)))
      {
        var op2 = this.AddOutPt(ePrev, horzEdge.Bot);
        this.AddJoin(op1, op2, horzEdge.Top);
      }
      else if (eNext !== null && eNext.Curr.X == horzEdge.Bot.X &&
        eNext.Curr.Y == horzEdge.Bot.Y && eNext.WindDelta !== 0 &&
        eNext.OutIdx >= 0 && eNext.Curr.Y > eNext.Top.Y &&
        ClipperLib.ClipperBase.SlopesEqual(horzEdge, eNext, this.m_UseFullRange))
      {
        var op2 = this.AddOutPt(eNext, horzEdge.Bot);
        this.AddJoin(op1, op2, horzEdge.Top);
      }
    }
    else horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
  }
  else if (eMaxPair !== null)
  {
    if (eMaxPair.OutIdx >= 0)
    {
      if (dir == ClipperLib.Direction.dLeftToRight)
        this.IntersectEdges(horzEdge, eMaxPair, horzEdge.Top, false);
      else
        this.IntersectEdges(eMaxPair, horzEdge, horzEdge.Top, false);
      if (eMaxPair.OutIdx >= 0)
        ClipperLib.Error("ProcessHorizontal error");
    }
    else
    {
      this.DeleteFromAEL(horzEdge);
      this.DeleteFromAEL(eMaxPair);
    }
  }
  else
  {
    if (horzEdge.OutIdx >= 0)
      this.AddOutPt(horzEdge, horzEdge.Top);
    this.DeleteFromAEL(horzEdge);
  }
};
ClipperLib.Clipper.prototype.GetNextInAEL = function (e, Direction)
{
  return Direction == ClipperLib.Direction.dLeftToRight ? e.NextInAEL : e.PrevInAEL;
};
ClipperLib.Clipper.prototype.IsMinima = function (e)
{
  return e !== null && (e.Prev.NextInLML != e) && (e.Next.NextInLML != e);
};
ClipperLib.Clipper.prototype.IsMaxima = function (e, Y)
{
  return (e !== null && e.Top.Y == Y && e.NextInLML === null);
};
ClipperLib.Clipper.prototype.IsIntermediate = function (e, Y)
{
  return (e.Top.Y == Y && e.NextInLML !== null);
};
ClipperLib.Clipper.prototype.GetMaximaPair = function (e)
{
  var result = null;
  if ((ClipperLib.IntPoint.op_Equality(e.Next.Top, e.Top)) && e.Next.NextInLML === null)
    result = e.Next;
  else if ((ClipperLib.IntPoint.op_Equality(e.Prev.Top, e.Top)) && e.Prev.NextInLML === null)
    result = e.Prev;
  if (result !== null && (result.OutIdx == -2 || (result.NextInAEL == result.PrevInAEL && !ClipperLib.ClipperBase.IsHorizontal(result))))
    return null;
  return result;
};
ClipperLib.Clipper.prototype.ProcessIntersections = function (botY, topY)
{
  if (this.m_ActiveEdges == null)
    return true;
  try
  {
    this.BuildIntersectList(botY, topY);
    if (this.m_IntersectList.length == 0)
      return true;
    if (this.m_IntersectList.length == 1 || this.FixupIntersectionOrder())
      this.ProcessIntersectList();
    else
      return false;
  }
  catch ($$e2)
  {
    this.m_SortedEdges = null;
    this.m_IntersectList.length = 0;
    ClipperLib.Error("ProcessIntersections error");
  }
  this.m_SortedEdges = null;
  return true;
};
ClipperLib.Clipper.prototype.BuildIntersectList = function (botY, topY)
{
  if (this.m_ActiveEdges === null)
    return;
  //prepare for sorting ...
  var e = this.m_ActiveEdges;
  //console.log(JSON.stringify(JSON.decycle( e )));
  this.m_SortedEdges = e;
  while (e !== null)
  {
    e.PrevInSEL = e.PrevInAEL;
    e.NextInSEL = e.NextInAEL;
    e.Curr.X = ClipperLib.Clipper.TopX(e, topY);
    e = e.NextInAEL;
  }
  //bubblesort ...
  var isModified = true;
  while (isModified && this.m_SortedEdges !== null)
  {
    isModified = false;
    e = this.m_SortedEdges;
    while (e.NextInSEL !== null)
    {
      var eNext = e.NextInSEL;
      var pt = new ClipperLib.IntPoint();
      //console.log("e.Curr.X: " + e.Curr.X + " eNext.Curr.X" + eNext.Curr.X);
      if (e.Curr.X > eNext.Curr.X)
      {
        if (!this.IntersectPoint(e, eNext, pt) && e.Curr.X > eNext.Curr.X + 1)
        {
          //console.log("e.Curr.X: "+JSON.stringify(JSON.decycle( e.Curr.X )));
          //console.log("eNext.Curr.X+1: "+JSON.stringify(JSON.decycle( eNext.Curr.X+1)));
          ClipperLib.Error("Intersection error");
        }
        if (pt.Y > botY)
        {
          pt.Y = botY;
          if (Math.abs(e.Dx) > Math.abs(eNext.Dx))
            pt.X = ClipperLib.Clipper.TopX(eNext, botY);
          else
            pt.X = ClipperLib.Clipper.TopX(e, botY);
        }
        var newNode = new ClipperLib.IntersectNode();
        newNode.Edge1 = e;
        newNode.Edge2 = eNext;
        //newNode.Pt = pt;
        newNode.Pt.X = pt.X;
        newNode.Pt.Y = pt.Y;
        this.m_IntersectList.push(newNode);
        this.SwapPositionsInSEL(e, eNext);
        isModified = true;
      }
      else
        e = eNext;
    }
    if (e.PrevInSEL !== null)
      e.PrevInSEL.NextInSEL = null;
    else
      break;
  }
  this.m_SortedEdges = null;
};
ClipperLib.Clipper.prototype.EdgesAdjacent = function (inode)
{
  return (inode.Edge1.NextInSEL == inode.Edge2) || (inode.Edge1.PrevInSEL == inode.Edge2);
};
ClipperLib.Clipper.IntersectNodeSort = function (node1, node2)
{
  //the following typecast is safe because the differences in Pt.Y will
  //be limited to the height of the scanbeam.
  return (node2.Pt.Y - node1.Pt.Y);
};
ClipperLib.Clipper.prototype.FixupIntersectionOrder = function ()
{
  //pre-condition: intersections are sorted bottom-most first.
  //Now it's crucial that intersections are made only between adjacent edges,
  //so to ensure this the order of intersections may need adjusting ...
  this.m_IntersectList.sort(this.m_IntersectNodeComparer);
  this.CopyAELToSEL();
  var cnt = this.m_IntersectList.length;
  for (var i = 0; i < cnt; i++)
  {
    if (!this.EdgesAdjacent(this.m_IntersectList[i]))
    {
      var j = i + 1;
      while (j < cnt && !this.EdgesAdjacent(this.m_IntersectList[j]))
        j++;
      if (j == cnt)
        return false;
      var tmp = this.m_IntersectList[i];
      this.m_IntersectList[i] = this.m_IntersectList[j];
      this.m_IntersectList[j] = tmp;
    }
    this.SwapPositionsInSEL(this.m_IntersectList[i].Edge1, this.m_IntersectList[i].Edge2);
  }
  return true;
};
ClipperLib.Clipper.prototype.ProcessIntersectList = function ()
{
  for (var i = 0, ilen = this.m_IntersectList.length; i < ilen; i++)
  {
    var iNode = this.m_IntersectList[i];
    this.IntersectEdges(iNode.Edge1, iNode.Edge2, iNode.Pt, true);
    this.SwapPositionsInAEL(iNode.Edge1, iNode.Edge2);
  }
  this.m_IntersectList.length = 0;
};
/*
--------------------------------
Round speedtest: http://jsperf.com/fastest-round
--------------------------------
*/
var R1 = function (a)
{
  return a < 0 ? Math.ceil(a - 0.5) : Math.round(a)
};
var R2 = function (a)
{
  return a < 0 ? Math.ceil(a - 0.5) : Math.floor(a + 0.5)
};
var R3 = function (a)
{
  return a < 0 ? -Math.round(Math.abs(a)) : Math.round(a)
};
var R4 = function (a)
{
  if (a < 0)
  {
    a -= 0.5;
    return a < -2147483648 ? Math.ceil(a) : a | 0;
  }
  else
  {
    a += 0.5;
    return a > 2147483647 ? Math.floor(a) : a | 0;
  }
};
if (browser.msie) ClipperLib.Clipper.Round = R1;
else if (browser.chromium) ClipperLib.Clipper.Round = R3;
else if (browser.safari) ClipperLib.Clipper.Round = R4;
else ClipperLib.Clipper.Round = R2; // eg. browser.chrome || browser.firefox || browser.opera
ClipperLib.Clipper.TopX = function (edge, currentY)
{
  //if (edge.Bot == edge.Curr) alert ("edge.Bot = edge.Curr");
  //if (edge.Bot == edge.Top) alert ("edge.Bot = edge.Top");
  if (currentY == edge.Top.Y)
    return edge.Top.X;
  return edge.Bot.X + ClipperLib.Clipper.Round(edge.Dx * (currentY - edge.Bot.Y));
};
ClipperLib.Clipper.prototype.IntersectPoint = function (edge1, edge2, ip)
{
  ip.X = 0;
  ip.Y = 0;
  var b1, b2;
  //nb: with very large coordinate values, it's possible for SlopesEqual() to 
  //return false but for the edge.Dx value be equal due to double precision rounding.
  if (ClipperLib.ClipperBase.SlopesEqual(edge1, edge2, this.m_UseFullRange) || edge1.Dx == edge2.Dx)
  {
    if (edge2.Bot.Y > edge1.Bot.Y)
    {
      ip.X = edge2.Bot.X;
      ip.Y = edge2.Bot.Y;
    }
    else
    {
      ip.X = edge1.Bot.X;
      ip.Y = edge1.Bot.Y;
    }
    return false;
  }
  else if (edge1.Delta.X === 0)
  {
    ip.X = edge1.Bot.X;
    if (ClipperLib.ClipperBase.IsHorizontal(edge2))
    {
      ip.Y = edge2.Bot.Y;
    }
    else
    {
      b2 = edge2.Bot.Y - (edge2.Bot.X / edge2.Dx);
      ip.Y = ClipperLib.Clipper.Round(ip.X / edge2.Dx + b2);
    }
  }
  else if (edge2.Delta.X === 0)
  {
    ip.X = edge2.Bot.X;
    if (ClipperLib.ClipperBase.IsHorizontal(edge1))
    {
      ip.Y = edge1.Bot.Y;
    }
    else
    {
      b1 = edge1.Bot.Y - (edge1.Bot.X / edge1.Dx);
      ip.Y = ClipperLib.Clipper.Round(ip.X / edge1.Dx + b1);
    }
  }
  else
  {
    b1 = edge1.Bot.X - edge1.Bot.Y * edge1.Dx;
    b2 = edge2.Bot.X - edge2.Bot.Y * edge2.Dx;
    var q = (b2 - b1) / (edge1.Dx - edge2.Dx);
    ip.Y = ClipperLib.Clipper.Round(q);
    if (Math.abs(edge1.Dx) < Math.abs(edge2.Dx))
      ip.X = ClipperLib.Clipper.Round(edge1.Dx * q + b1);
    else
      ip.X = ClipperLib.Clipper.Round(edge2.Dx * q + b2);
  }
  if (ip.Y < edge1.Top.Y || ip.Y < edge2.Top.Y)
  {
    if (edge1.Top.Y > edge2.Top.Y)
    {
      ip.Y = edge1.Top.Y;
      ip.X = ClipperLib.Clipper.TopX(edge2, edge1.Top.Y);
      return ip.X < edge1.Top.X;
    }
    else
      ip.Y = edge2.Top.Y;
    if (Math.abs(edge1.Dx) < Math.abs(edge2.Dx))
      ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
    else
      ip.X = ClipperLib.Clipper.TopX(edge2, ip.Y);
  }
  return true;
};
ClipperLib.Clipper.prototype.ProcessEdgesAtTopOfScanbeam = function (topY)
{
  var e = this.m_ActiveEdges;
  while (e !== null)
  {
    //1. process maxima, treating them as if they're 'bent' horizontal edges,
    //   but exclude maxima with horizontal edges. nb: e can't be a horizontal.
    var IsMaximaEdge = this.IsMaxima(e, topY);
    if (IsMaximaEdge)
    {
      var eMaxPair = this.GetMaximaPair(e);
      IsMaximaEdge = (eMaxPair === null || !ClipperLib.ClipperBase.IsHorizontal(eMaxPair));
    }
    if (IsMaximaEdge)
    {
      var ePrev = e.PrevInAEL;
      this.DoMaxima(e);
      if (ePrev === null)
        e = this.m_ActiveEdges;
      else
        e = ePrev.NextInAEL;
    }
    else
    {
      //2. promote horizontal edges, otherwise update Curr.X and Curr.Y ...
      if (this.IsIntermediate(e, topY) && ClipperLib.ClipperBase.IsHorizontal(e.NextInLML))
      {
        e = this.UpdateEdgeIntoAEL(e);
        if (e.OutIdx >= 0)
          this.AddOutPt(e, e.Bot);
        this.AddEdgeToSEL(e);
      }
      else
      {
        e.Curr.X = ClipperLib.Clipper.TopX(e, topY);
        e.Curr.Y = topY;
      }
      if (this.StrictlySimple)
      {
        var ePrev = e.PrevInAEL;
        if ((e.OutIdx >= 0) && (e.WindDelta !== 0) && ePrev !== null &&
          (ePrev.OutIdx >= 0) && (ePrev.Curr.X == e.Curr.X) &&
          (ePrev.WindDelta !== 0))
        {
          var op = this.AddOutPt(ePrev, e.Curr);
          var op2 = this.AddOutPt(e, e.Curr);
          this.AddJoin(op, op2, e.Curr);
          //StrictlySimple (type-3) join
        }
      }
      e = e.NextInAEL;
    }
  }
  //3. Process horizontals at the Top of the scanbeam ...
  this.ProcessHorizontals(true);
  //4. Promote intermediate vertices ...
  e = this.m_ActiveEdges;
  while (e !== null)
  {
    if (this.IsIntermediate(e, topY))
    {
      var op = null;
      if (e.OutIdx >= 0)
        op = this.AddOutPt(e, e.Top);
      e = this.UpdateEdgeIntoAEL(e);
      //if output polygons share an edge, they'll need joining later ...
      var ePrev = e.PrevInAEL;
      var eNext = e.NextInAEL;
      if (ePrev !== null && ePrev.Curr.X == e.Bot.X &&
        ePrev.Curr.Y == e.Bot.Y && op !== null &&
        ePrev.OutIdx >= 0 && ePrev.Curr.Y > ePrev.Top.Y &&
        ClipperLib.ClipperBase.SlopesEqual(e, ePrev, this.m_UseFullRange) &&
        (e.WindDelta !== 0) && (ePrev.WindDelta !== 0))
      {
        var op2 = this.AddOutPt(ePrev, e.Bot);
        this.AddJoin(op, op2, e.Top);
      }
      else if (eNext !== null && eNext.Curr.X == e.Bot.X &&
        eNext.Curr.Y == e.Bot.Y && op !== null &&
        eNext.OutIdx >= 0 && eNext.Curr.Y > eNext.Top.Y &&
        ClipperLib.ClipperBase.SlopesEqual(e, eNext, this.m_UseFullRange) &&
        (e.WindDelta !== 0) && (eNext.WindDelta !== 0))
      {
        var op2 = this.AddOutPt(eNext, e.Bot);
        this.AddJoin(op, op2, e.Top);
      }
    }
    e = e.NextInAEL;
  }
};
ClipperLib.Clipper.prototype.DoMaxima = function (e)
{
  var eMaxPair = this.GetMaximaPair(e);
  if (eMaxPair === null)
  {
    if (e.OutIdx >= 0)
      this.AddOutPt(e, e.Top);
    this.DeleteFromAEL(e);
    return;
  }
  var eNext = e.NextInAEL;
  var use_lines = true;
  while (eNext !== null && eNext != eMaxPair)
  {
    this.IntersectEdges(e, eNext, e.Top, true);
    this.SwapPositionsInAEL(e, eNext);
    eNext = e.NextInAEL;
  }
  if (e.OutIdx == -1 && eMaxPair.OutIdx == -1)
  {
    this.DeleteFromAEL(e);
    this.DeleteFromAEL(eMaxPair);
  }
  else if (e.OutIdx >= 0 && eMaxPair.OutIdx >= 0)
  {
    this.IntersectEdges(e, eMaxPair, e.Top, false);
  }
  else if (use_lines && e.WindDelta === 0)
  {
    if (e.OutIdx >= 0)
    {
      this.AddOutPt(e, e.Top);
      e.OutIdx = -1;
    }
    this.DeleteFromAEL(e);
    if (eMaxPair.OutIdx >= 0)
    {
      this.AddOutPt(eMaxPair, e.Top);
      eMaxPair.OutIdx = -1;
    }
    this.DeleteFromAEL(eMaxPair);
  }
  else
    ClipperLib.Error("DoMaxima error");
};
ClipperLib.Clipper.ReversePaths = function (polys)
{
  for (var i = 0, len = polys.length; i < len; i++)
    polys[i].reverse();
};
ClipperLib.Clipper.Orientation = function (poly)
{
  return ClipperLib.Clipper.Area(poly) >= 0;
};
ClipperLib.Clipper.prototype.PointCount = function (pts)
{
  if (pts === null)
    return 0;
  var result = 0;
  var p = pts;
  do {
    result++;
    p = p.Next;
  }
  while (p != pts)
  return result;
};
ClipperLib.Clipper.prototype.BuildResult = function (polyg)
{
  ClipperLib.Clear(polyg);
  for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
  {
    var outRec = this.m_PolyOuts[i];
    if (outRec.Pts === null)
      continue;
    var p = outRec.Pts.Prev;
    var cnt = this.PointCount(p);
    if (cnt < 2)
      continue;
    var pg = new Array(cnt);
    for (var j = 0; j < cnt; j++)
    {
      pg[j] = p.Pt;
      p = p.Prev;
    }
    polyg.push(pg);
  }
};
ClipperLib.Clipper.prototype.BuildResult2 = function (polytree)
{
  polytree.Clear();
  //add each output polygon/contour to polytree ...
  //polytree.m_AllPolys.set_Capacity(this.m_PolyOuts.length);
  for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
  {
    var outRec = this.m_PolyOuts[i];
    var cnt = this.PointCount(outRec.Pts);
    if ((outRec.IsOpen && cnt < 2) || (!outRec.IsOpen && cnt < 3))
      continue;
    this.FixHoleLinkage(outRec);
    var pn = new ClipperLib.PolyNode();
    polytree.m_AllPolys.push(pn);
    outRec.PolyNode = pn;
    pn.m_polygon.length = cnt;
    var op = outRec.Pts.Prev;
    for (var j = 0; j < cnt; j++)
    {
      pn.m_polygon[j] = op.Pt;
      op = op.Prev;
    }
  }
  //fixup PolyNode links etc ...
  //polytree.m_Childs.set_Capacity(this.m_PolyOuts.length);
  for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
  {
    var outRec = this.m_PolyOuts[i];
    if (outRec.PolyNode === null)
      continue;
    else if (outRec.IsOpen)
    {
      outRec.PolyNode.IsOpen = true;
      polytree.AddChild(outRec.PolyNode);
    }
    else if (outRec.FirstLeft !== null && outRec.FirstLeft.PolyNode != null)
      outRec.FirstLeft.PolyNode.AddChild(outRec.PolyNode);
    else
      polytree.AddChild(outRec.PolyNode);
  }
};
ClipperLib.Clipper.prototype.FixupOutPolygon = function (outRec)
{
  //FixupOutPolygon() - removes duplicate points and simplifies consecutive
  //parallel edges by removing the middle vertex.
  var lastOK = null;
  outRec.BottomPt = null;
  var pp = outRec.Pts;
  for (;;)
  {
    if (pp.Prev == pp || pp.Prev == pp.Next)
    {
      this.DisposeOutPts(pp);
      outRec.Pts = null;
      return;
    }
    //test for duplicate points and collinear edges ...
    if ((ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Next.Pt)) || (ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Prev.Pt)) ||
      (ClipperLib.ClipperBase.SlopesEqual(pp.Prev.Pt, pp.Pt, pp.Next.Pt, this.m_UseFullRange) &&
        (!this.PreserveCollinear || !this.Pt2IsBetweenPt1AndPt3(pp.Prev.Pt, pp.Pt, pp.Next.Pt))))
    {
      lastOK = null;
      var tmp = pp;
      pp.Prev.Next = pp.Next;
      pp.Next.Prev = pp.Prev;
      pp = pp.Prev;
      tmp = null;
    }
    else if (pp == lastOK)
      break;
    else
    {
      if (lastOK === null)
        lastOK = pp;
      pp = pp.Next;
    }
  }
  outRec.Pts = pp;
};
ClipperLib.Clipper.prototype.DupOutPt = function (outPt, InsertAfter)
{
  var result = new ClipperLib.OutPt();
  //result.Pt = outPt.Pt;
  result.Pt.X = outPt.Pt.X;
  result.Pt.Y = outPt.Pt.Y;
  result.Idx = outPt.Idx;
  if (InsertAfter)
  {
    result.Next = outPt.Next;
    result.Prev = outPt;
    outPt.Next.Prev = result;
    outPt.Next = result;
  }
  else
  {
    result.Prev = outPt.Prev;
    result.Next = outPt;
    outPt.Prev.Next = result;
    outPt.Prev = result;
  }
  return result;
};
ClipperLib.Clipper.prototype.GetOverlap = function (a1, a2, b1, b2, $val)
{
  if (a1 < a2)
  {
    if (b1 < b2)
    {
      $val.Left = Math.max(a1, b1);
      $val.Right = Math.min(a2, b2);
    }
    else
    {
      $val.Left = Math.max(a1, b2);
      $val.Right = Math.min(a2, b1);
    }
  }
  else
  {
    if (b1 < b2)
    {
      $val.Left = Math.max(a2, b1);
      $val.Right = Math.min(a1, b2);
    }
    else
    {
      $val.Left = Math.max(a2, b2);
      $val.Right = Math.min(a1, b1);
    }
  }
  return $val.Left < $val.Right;
};
ClipperLib.Clipper.prototype.JoinHorz = function (op1, op1b, op2, op2b, Pt, DiscardLeft)
{
  var Dir1 = (op1.Pt.X > op1b.Pt.X ? ClipperLib.Direction.dRightToLeft : ClipperLib.Direction.dLeftToRight);
  var Dir2 = (op2.Pt.X > op2b.Pt.X ? ClipperLib.Direction.dRightToLeft : ClipperLib.Direction.dLeftToRight);
  if (Dir1 == Dir2)
    return false;
  //When DiscardLeft, we want Op1b to be on the Left of Op1, otherwise we
  //want Op1b to be on the Right. (And likewise with Op2 and Op2b.)
  //So, to facilitate this while inserting Op1b and Op2b ...
  //when DiscardLeft, make sure we're AT or RIGHT of Pt before adding Op1b,
  //otherwise make sure we're AT or LEFT of Pt. (Likewise with Op2b.)
  if (Dir1 == ClipperLib.Direction.dLeftToRight)
  {
    while (op1.Next.Pt.X <= Pt.X &&
      op1.Next.Pt.X >= op1.Pt.X && op1.Next.Pt.Y == Pt.Y)
      op1 = op1.Next;
    if (DiscardLeft && (op1.Pt.X != Pt.X))
      op1 = op1.Next;
    op1b = this.DupOutPt(op1, !DiscardLeft);
    if (ClipperLib.IntPoint.op_Inequality(op1b.Pt, Pt))
    {
      op1 = op1b;
      //op1.Pt = Pt;
      op1.Pt.X = Pt.X;
      op1.Pt.Y = Pt.Y;
      op1b = this.DupOutPt(op1, !DiscardLeft);
    }
  }
  else
  {
    while (op1.Next.Pt.X >= Pt.X &&
      op1.Next.Pt.X <= op1.Pt.X && op1.Next.Pt.Y == Pt.Y)
      op1 = op1.Next;
    if (!DiscardLeft && (op1.Pt.X != Pt.X))
      op1 = op1.Next;
    op1b = this.DupOutPt(op1, DiscardLeft);
    if (ClipperLib.IntPoint.op_Inequality(op1b.Pt, Pt))
    {
      op1 = op1b;
      //op1.Pt = Pt;
      op1.Pt.X = Pt.X;
      op1.Pt.Y = Pt.Y;
      op1b = this.DupOutPt(op1, DiscardLeft);
    }
  }
  if (Dir2 == ClipperLib.Direction.dLeftToRight)
  {
    while (op2.Next.Pt.X <= Pt.X &&
      op2.Next.Pt.X >= op2.Pt.X && op2.Next.Pt.Y == Pt.Y)
      op2 = op2.Next;
    if (DiscardLeft && (op2.Pt.X != Pt.X))
      op2 = op2.Next;
    op2b = this.DupOutPt(op2, !DiscardLeft);
    if (ClipperLib.IntPoint.op_Inequality(op2b.Pt, Pt))
    {
      op2 = op2b;
      //op2.Pt = Pt;
      op2.Pt.X = Pt.X;
      op2.Pt.Y = Pt.Y;
      op2b = this.DupOutPt(op2, !DiscardLeft);
    }
  }
  else
  {
    while (op2.Next.Pt.X >= Pt.X &&
      op2.Next.Pt.X <= op2.Pt.X && op2.Next.Pt.Y == Pt.Y)
      op2 = op2.Next;
    if (!DiscardLeft && (op2.Pt.X != Pt.X))
      op2 = op2.Next;
    op2b = this.DupOutPt(op2, DiscardLeft);
    if (ClipperLib.IntPoint.op_Inequality(op2b.Pt, Pt))
    {
      op2 = op2b;
      //op2.Pt = Pt;
      op2.Pt.X = Pt.X;
      op2.Pt.Y = Pt.Y;
      op2b = this.DupOutPt(op2, DiscardLeft);
    }
  }
  if ((Dir1 == ClipperLib.Direction.dLeftToRight) == DiscardLeft)
  {
    op1.Prev = op2;
    op2.Next = op1;
    op1b.Next = op2b;
    op2b.Prev = op1b;
  }
  else
  {
    op1.Next = op2;
    op2.Prev = op1;
    op1b.Prev = op2b;
    op2b.Next = op1b;
  }
  return true;
};
ClipperLib.Clipper.prototype.JoinPoints = function (j, outRec1, outRec2)
{
  var op1 = j.OutPt1,
    op1b = new ClipperLib.OutPt();
  var op2 = j.OutPt2,
    op2b = new ClipperLib.OutPt();
  //There are 3 kinds of joins for output polygons ...
  //1. Horizontal joins where Join.OutPt1 & Join.OutPt2 are a vertices anywhere
  //along (horizontal) collinear edges (& Join.OffPt is on the same horizontal).
  //2. Non-horizontal joins where Join.OutPt1 & Join.OutPt2 are at the same
  //location at the Bottom of the overlapping segment (& Join.OffPt is above).
  //3. StrictlySimple joins where edges touch but are not collinear and where
  //Join.OutPt1, Join.OutPt2 & Join.OffPt all share the same point.
  var isHorizontal = (j.OutPt1.Pt.Y == j.OffPt.Y);
  if (isHorizontal && (ClipperLib.IntPoint.op_Equality(j.OffPt, j.OutPt1.Pt)) && (ClipperLib.IntPoint.op_Equality(j.OffPt, j.OutPt2.Pt)))
  {
    //Strictly Simple join ...
    op1b = j.OutPt1.Next;
    while (op1b != op1 && (ClipperLib.IntPoint.op_Equality(op1b.Pt, j.OffPt)))
      op1b = op1b.Next;
    var reverse1 = (op1b.Pt.Y > j.OffPt.Y);
    op2b = j.OutPt2.Next;
    while (op2b != op2 && (ClipperLib.IntPoint.op_Equality(op2b.Pt, j.OffPt)))
      op2b = op2b.Next;
    var reverse2 = (op2b.Pt.Y > j.OffPt.Y);
    if (reverse1 == reverse2)
      return false;
    if (reverse1)
    {
      op1b = this.DupOutPt(op1, false);
      op2b = this.DupOutPt(op2, true);
      op1.Prev = op2;
      op2.Next = op1;
      op1b.Next = op2b;
      op2b.Prev = op1b;
      j.OutPt1 = op1;
      j.OutPt2 = op1b;
      return true;
    }
    else
    {
      op1b = this.DupOutPt(op1, true);
      op2b = this.DupOutPt(op2, false);
      op1.Next = op2;
      op2.Prev = op1;
      op1b.Prev = op2b;
      op2b.Next = op1b;
      j.OutPt1 = op1;
      j.OutPt2 = op1b;
      return true;
    }
  }
  else if (isHorizontal)
  {
    //treat horizontal joins differently to non-horizontal joins since with
    //them we're not yet sure where the overlapping is. OutPt1.Pt & OutPt2.Pt
    //may be anywhere along the horizontal edge.
    op1b = op1;
    while (op1.Prev.Pt.Y == op1.Pt.Y && op1.Prev != op1b && op1.Prev != op2)
      op1 = op1.Prev;
    while (op1b.Next.Pt.Y == op1b.Pt.Y && op1b.Next != op1 && op1b.Next != op2)
      op1b = op1b.Next;
    if (op1b.Next == op1 || op1b.Next == op2)
      return false;
    //a flat 'polygon'
    op2b = op2;
    while (op2.Prev.Pt.Y == op2.Pt.Y && op2.Prev != op2b && op2.Prev != op1b)
      op2 = op2.Prev;
    while (op2b.Next.Pt.Y == op2b.Pt.Y && op2b.Next != op2 && op2b.Next != op1)
      op2b = op2b.Next;
    if (op2b.Next == op2 || op2b.Next == op1)
      return false;
    //a flat 'polygon'
    //Op1 -. Op1b & Op2 -. Op2b are the extremites of the horizontal edges

    var $val = {Left: null, Right: null};
    if (!this.GetOverlap(op1.Pt.X, op1b.Pt.X, op2.Pt.X, op2b.Pt.X, $val))
      return false;
    var Left = $val.Left;
    var Right = $val.Right;

    //DiscardLeftSide: when overlapping edges are joined, a spike will created
    //which needs to be cleaned up. However, we don't want Op1 or Op2 caught up
    //on the discard Side as either may still be needed for other joins ...
    var Pt = new ClipperLib.IntPoint();
    var DiscardLeftSide;
    if (op1.Pt.X >= Left && op1.Pt.X <= Right)
    {
      //Pt = op1.Pt;
      Pt.X = op1.Pt.X;
      Pt.Y = op1.Pt.Y;
      DiscardLeftSide = (op1.Pt.X > op1b.Pt.X);
    }
    else if (op2.Pt.X >= Left && op2.Pt.X <= Right)
    {
      //Pt = op2.Pt;
      Pt.X = op2.Pt.X;
      Pt.Y = op2.Pt.Y;
      DiscardLeftSide = (op2.Pt.X > op2b.Pt.X);
    }
    else if (op1b.Pt.X >= Left && op1b.Pt.X <= Right)
    {
      //Pt = op1b.Pt;
      Pt.X = op1b.Pt.X;
      Pt.Y = op1b.Pt.Y;
      DiscardLeftSide = op1b.Pt.X > op1.Pt.X;
    }
    else
    {
      //Pt = op2b.Pt;
      Pt.X = op2b.Pt.X;
      Pt.Y = op2b.Pt.Y;
      DiscardLeftSide = (op2b.Pt.X > op2.Pt.X);
    }
    j.OutPt1 = op1;
    j.OutPt2 = op2;
    return this.JoinHorz(op1, op1b, op2, op2b, Pt, DiscardLeftSide);
  }
  else
  {
    //nb: For non-horizontal joins ...
    //    1. Jr.OutPt1.Pt.Y == Jr.OutPt2.Pt.Y
    //    2. Jr.OutPt1.Pt > Jr.OffPt.Y
    //make sure the polygons are correctly oriented ...
    op1b = op1.Next;
    while ((ClipperLib.IntPoint.op_Equality(op1b.Pt, op1.Pt)) && (op1b != op1))
      op1b = op1b.Next;
    var Reverse1 = ((op1b.Pt.Y > op1.Pt.Y) || !ClipperLib.ClipperBase.SlopesEqual(op1.Pt, op1b.Pt, j.OffPt, this.m_UseFullRange));
    if (Reverse1)
    {
      op1b = op1.Prev;
      while ((ClipperLib.IntPoint.op_Equality(op1b.Pt, op1.Pt)) && (op1b != op1))
        op1b = op1b.Prev;
      if ((op1b.Pt.Y > op1.Pt.Y) || !ClipperLib.ClipperBase.SlopesEqual(op1.Pt, op1b.Pt, j.OffPt, this.m_UseFullRange))
        return false;
    }
    op2b = op2.Next;
    while ((ClipperLib.IntPoint.op_Equality(op2b.Pt, op2.Pt)) && (op2b != op2))
      op2b = op2b.Next;
    var Reverse2 = ((op2b.Pt.Y > op2.Pt.Y) || !ClipperLib.ClipperBase.SlopesEqual(op2.Pt, op2b.Pt, j.OffPt, this.m_UseFullRange));
    if (Reverse2)
    {
      op2b = op2.Prev;
      while ((ClipperLib.IntPoint.op_Equality(op2b.Pt, op2.Pt)) && (op2b != op2))
        op2b = op2b.Prev;
      if ((op2b.Pt.Y > op2.Pt.Y) || !ClipperLib.ClipperBase.SlopesEqual(op2.Pt, op2b.Pt, j.OffPt, this.m_UseFullRange))
        return false;
    }
    if ((op1b == op1) || (op2b == op2) || (op1b == op2b) ||
      ((outRec1 == outRec2) && (Reverse1 == Reverse2)))
      return false;
    if (Reverse1)
    {
      op1b = this.DupOutPt(op1, false);
      op2b = this.DupOutPt(op2, true);
      op1.Prev = op2;
      op2.Next = op1;
      op1b.Next = op2b;
      op2b.Prev = op1b;
      j.OutPt1 = op1;
      j.OutPt2 = op1b;
      return true;
    }
    else
    {
      op1b = this.DupOutPt(op1, true);
      op2b = this.DupOutPt(op2, false);
      op1.Next = op2;
      op2.Prev = op1;
      op1b.Prev = op2b;
      op2b.Next = op1b;
      j.OutPt1 = op1;
      j.OutPt2 = op1b;
      return true;
    }
  }
};
ClipperLib.Clipper.GetBounds = function (paths)
{
  var i = 0,
    cnt = paths.length;
  while (i < cnt && paths[i].length == 0) i++;
  if (i == cnt) return new ClipperLib.IntRect(0, 0, 0, 0);
  var result = new ClipperLib.IntRect();
  result.left = paths[i][0].X;
  result.right = result.left;
  result.top = paths[i][0].Y;
  result.bottom = result.top;
  for (; i < cnt; i++)
    for (var j = 0, jlen = paths[i].length; j < jlen; j++)
    {
      if (paths[i][j].X < result.left) result.left = paths[i][j].X;
      else if (paths[i][j].X > result.right) result.right = paths[i][j].X;
      if (paths[i][j].Y < result.top) result.top = paths[i][j].Y;
      else if (paths[i][j].Y > result.bottom) result.bottom = paths[i][j].Y;
    }
  return result;
}
ClipperLib.Clipper.prototype.GetBounds2 = function (ops)
{
  var opStart = ops;
  var result = new ClipperLib.IntRect();
  result.left = ops.Pt.X;
  result.right = ops.Pt.X;
  result.top = ops.Pt.Y;
  result.bottom = ops.Pt.Y;
  ops = ops.Next;
  while (ops != opStart)
  {
    if (ops.Pt.X < result.left)
      result.left = ops.Pt.X;
    if (ops.Pt.X > result.right)
      result.right = ops.Pt.X;
    if (ops.Pt.Y < result.top)
      result.top = ops.Pt.Y;
    if (ops.Pt.Y > result.bottom)
      result.bottom = ops.Pt.Y;
    ops = ops.Next;
  }
  return result;
};

ClipperLib.Clipper.PointInPolygon = function (pt, path)
{
  //returns 0 if false, +1 if true, -1 if pt ON polygon boundary
  //http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.88.5498&rep=rep1&type=pdf
  var result = 0,
    cnt = path.length;
  if (cnt < 3)
    return 0;
  var ip = path[0];
  for (var i = 1; i <= cnt; ++i)
  {
    var ipNext = (i == cnt ? path[0] : path[i]);
    if (ipNext.Y == pt.Y)
    {
      if ((ipNext.X == pt.X) || (ip.Y == pt.Y && ((ipNext.X > pt.X) == (ip.X < pt.X))))
        return -1;
    }
    if ((ip.Y < pt.Y) != (ipNext.Y < pt.Y))
    {
      if (ip.X >= pt.X)
      {
        if (ipNext.X > pt.X)
          result = 1 - result;
        else
        {
          var d = (ip.X - pt.X) * (ipNext.Y - pt.Y) - (ipNext.X - pt.X) * (ip.Y - pt.Y);
          if (d == 0)
            return -1;
          else if ((d > 0) == (ipNext.Y > ip.Y))
            result = 1 - result;
        }
      }
      else
      {
        if (ipNext.X > pt.X)
        {
          var d = (ip.X - pt.X) * (ipNext.Y - pt.Y) - (ipNext.X - pt.X) * (ip.Y - pt.Y);
          if (d == 0)
            return -1;
          else if ((d > 0) == (ipNext.Y > ip.Y))
            result = 1 - result;
        }
      }
    }
    ip = ipNext;
  }
  return result;
};
    
ClipperLib.Clipper.prototype.PointInPolygon = function (pt, op)
{
  //returns 0 if false, +1 if true, -1 if pt ON polygon boundary
  //http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.88.5498&rep=rep1&type=pdf
  var result = 0;
  var startOp = op;
  for (;;)
  {
    var poly0x = op.Pt.X,
      poly0y = op.Pt.Y;
    var poly1x = op.Next.Pt.X,
      poly1y = op.Next.Pt.Y;
    if (poly1y == pt.Y)
    {
      if ((poly1x == pt.X) || (poly0y == pt.Y && ((poly1x > pt.X) == (poly0x < pt.X))))
        return -1;
    }
    if ((poly0y < pt.Y) != (poly1y < pt.Y))
    {
      if (poly0x >= pt.X)
      {
        if (poly1x > pt.X)
          result = 1 - result;
        else
        {
          var d = (poly0x - pt.X) * (poly1y - pt.Y) - (poly1x - pt.X) * (poly0y - pt.Y);
          if (d == 0)
            return -1;
          if ((d > 0) == (poly1y > poly0y))
            result = 1 - result;
        }
      }
      else
      {
        if (poly1x > pt.X)
        {
          var d = (poly0x - pt.X) * (poly1y - pt.Y) - (poly1x - pt.X) * (poly0y - pt.Y);
          if (d == 0)
            return -1;
          if ((d > 0) == (poly1y > poly0y))
            result = 1 - result;
        }
      }
    }
    op = op.Next;
    if (startOp == op)
      break;
  }
  return result;
};

ClipperLib.Clipper.prototype.Poly2ContainsPoly1 = function (outPt1, outPt2)
{
  var op = outPt1;
  do {
    var res = this.PointInPolygon(op.Pt, outPt2);
    if (res >= 0)
      return res != 0;
    op = op.Next;
  }
  while (op != outPt1)
  return true;
};
ClipperLib.Clipper.prototype.FixupFirstLefts1 = function (OldOutRec, NewOutRec)
{
  for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++)
  {
    var outRec = this.m_PolyOuts[i];
    if (outRec.Pts !== null && outRec.FirstLeft == OldOutRec)
    {
      if (this.Poly2ContainsPoly1(outRec.Pts, NewOutRec.Pts))
        outRec.FirstLeft = NewOutRec;
    }
  }
};
ClipperLib.Clipper.prototype.FixupFirstLefts2 = function (OldOutRec, NewOutRec)
{
  for (var $i2 = 0, $t2 = this.m_PolyOuts, $l2 = $t2.length, outRec = $t2[$i2]; $i2 < $l2; $i2++, outRec = $t2[$i2])
    if (outRec.FirstLeft == OldOutRec)
      outRec.FirstLeft = NewOutRec;
};
ClipperLib.Clipper.ParseFirstLeft = function (FirstLeft)
{
  while (FirstLeft != null && FirstLeft.Pts == null)
    FirstLeft = FirstLeft.FirstLeft;
  return FirstLeft;
};
ClipperLib.Clipper.prototype.JoinCommonEdges = function ()
{
  for (var i = 0, ilen = this.m_Joins.length; i < ilen; i++)
  {
    var join = this.m_Joins[i];
    var outRec1 = this.GetOutRec(join.OutPt1.Idx);
    var outRec2 = this.GetOutRec(join.OutPt2.Idx);
    if (outRec1.Pts == null || outRec2.Pts == null)
      continue;
    //get the polygon fragment with the correct hole state (FirstLeft)
    //before calling JoinPoints() ...
    var holeStateRec;
    if (outRec1 == outRec2)
      holeStateRec = outRec1;
    else if (this.Param1RightOfParam2(outRec1, outRec2))
      holeStateRec = outRec2;
    else if (this.Param1RightOfParam2(outRec2, outRec1))
      holeStateRec = outRec1;
    else
      holeStateRec = this.GetLowermostRec(outRec1, outRec2);

    if (!this.JoinPoints(join, outRec1, outRec2)) continue;

    if (outRec1 == outRec2)
    {
      //instead of joining two polygons, we've just created a new one by
      //splitting one polygon into two.
      outRec1.Pts = join.OutPt1;
      outRec1.BottomPt = null;
      outRec2 = this.CreateOutRec();
      outRec2.Pts = join.OutPt2;
      //update all OutRec2.Pts Idx's ...
      this.UpdateOutPtIdxs(outRec2);
      //We now need to check every OutRec.FirstLeft pointer. If it points
      //to OutRec1 it may need to point to OutRec2 instead ...
      if (this.m_UsingPolyTree)
        for (var j = 0, jlen = this.m_PolyOuts.length; j < jlen - 1; j++)
        {
          var oRec = this.m_PolyOuts[j];
          if (oRec.Pts == null || ClipperLib.Clipper.ParseFirstLeft(oRec.FirstLeft) != outRec1 || oRec.IsHole == outRec1.IsHole)
            continue;
          if (this.Poly2ContainsPoly1(oRec.Pts, join.OutPt2))
            oRec.FirstLeft = outRec2;
        }
      if (this.Poly2ContainsPoly1(outRec2.Pts, outRec1.Pts))
      {
        //outRec2 is contained by outRec1 ...
        outRec2.IsHole = !outRec1.IsHole;
        outRec2.FirstLeft = outRec1;
        //fixup FirstLeft pointers that may need reassigning to OutRec1
        if (this.m_UsingPolyTree)
          this.FixupFirstLefts2(outRec2, outRec1);
        if ((outRec2.IsHole ^ this.ReverseSolution) == (this.Area(outRec2) > 0))
          this.ReversePolyPtLinks(outRec2.Pts);
      }
      else if (this.Poly2ContainsPoly1(outRec1.Pts, outRec2.Pts))
      {
        //outRec1 is contained by outRec2 ...
        outRec2.IsHole = outRec1.IsHole;
        outRec1.IsHole = !outRec2.IsHole;
        outRec2.FirstLeft = outRec1.FirstLeft;
        outRec1.FirstLeft = outRec2;
        //fixup FirstLeft pointers that may need reassigning to OutRec1
        if (this.m_UsingPolyTree)
          this.FixupFirstLefts2(outRec1, outRec2);
        if ((outRec1.IsHole ^ this.ReverseSolution) == (this.Area(outRec1) > 0))
          this.ReversePolyPtLinks(outRec1.Pts);
      }
      else
      {
        //the 2 polygons are completely separate ...
        outRec2.IsHole = outRec1.IsHole;
        outRec2.FirstLeft = outRec1.FirstLeft;
        //fixup FirstLeft pointers that may need reassigning to OutRec2
        if (this.m_UsingPolyTree)
          this.FixupFirstLefts1(outRec1, outRec2);
      }
    }
    else
    {
      //joined 2 polygons together ...
      outRec2.Pts = null;
      outRec2.BottomPt = null;
      outRec2.Idx = outRec1.Idx;
      outRec1.IsHole = holeStateRec.IsHole;
      if (holeStateRec == outRec2)
        outRec1.FirstLeft = outRec2.FirstLeft;
      outRec2.FirstLeft = outRec1;
      //fixup FirstLeft pointers that may need reassigning to OutRec1
      if (this.m_UsingPolyTree)
        this.FixupFirstLefts2(outRec2, outRec1);
    }
  }
};
ClipperLib.Clipper.prototype.UpdateOutPtIdxs = function (outrec)
{
  var op = outrec.Pts;
  do {
    op.Idx = outrec.Idx;
    op = op.Prev;
  }
  while (op != outrec.Pts)
};
ClipperLib.Clipper.prototype.DoSimplePolygons = function ()
{
  var i = 0;
  while (i < this.m_PolyOuts.length)
  {
    var outrec = this.m_PolyOuts[i++];
    var op = outrec.Pts;
    if (op === null)
      continue;
    do //for each Pt in Polygon until duplicate found do ...
    {
      var op2 = op.Next;
      while (op2 != outrec.Pts)
      {
        if ((ClipperLib.IntPoint.op_Equality(op.Pt, op2.Pt)) && op2.Next != op && op2.Prev != op)
        {
          //split the polygon into two ...
          var op3 = op.Prev;
          var op4 = op2.Prev;
          op.Prev = op4;
          op4.Next = op;
          op2.Prev = op3;
          op3.Next = op2;
          outrec.Pts = op;
          var outrec2 = this.CreateOutRec();
          outrec2.Pts = op2;
          this.UpdateOutPtIdxs(outrec2);
          if (this.Poly2ContainsPoly1(outrec2.Pts, outrec.Pts))
          {
            //OutRec2 is contained by OutRec1 ...
            outrec2.IsHole = !outrec.IsHole;
            outrec2.FirstLeft = outrec;
          }
          else if (this.Poly2ContainsPoly1(outrec.Pts, outrec2.Pts))
          {
            //OutRec1 is contained by OutRec2 ...
            outrec2.IsHole = outrec.IsHole;
            outrec.IsHole = !outrec2.IsHole;
            outrec2.FirstLeft = outrec.FirstLeft;
            outrec.FirstLeft = outrec2;
          }
          else
          {
            //the 2 polygons are separate ...
            outrec2.IsHole = outrec.IsHole;
            outrec2.FirstLeft = outrec.FirstLeft;
          }
          op2 = op;
          //ie get ready for the next iteration
        }
        op2 = op2.Next;
      }
      op = op.Next;
    }
    while (op != outrec.Pts)
  }
};
ClipperLib.Clipper.Area = function (poly)
{
  var cnt = poly.length;
  if (cnt < 3)
    return 0;
  var a = 0;
  for (var i = 0, j = cnt - 1; i < cnt; ++i)
  {
    a += (poly[j].X + poly[i].X) * (poly[j].Y - poly[i].Y);
    j = i;
  }
  return -a * 0.5;
};
ClipperLib.Clipper.prototype.Area = function (outRec)
{
  var op = outRec.Pts;
  if (op == null)
    return 0;
  var a = 0;
  do {
    a = a + (op.Prev.Pt.X + op.Pt.X) * (op.Prev.Pt.Y - op.Pt.Y);
    op = op.Next;
  }
  while (op != outRec.Pts)
  return a * 0.5;
};
if (use_deprecated)
{
  ClipperLib.Clipper.OffsetPaths = function (polys, delta, jointype, endtype, MiterLimit)
  {
    var result = new ClipperLib.Paths();
    var co = new ClipperLib.ClipperOffset(MiterLimit, MiterLimit);
    co.AddPaths(polys, jointype, endtype);
    co.Execute(result, delta);
    return result;
  };
}
ClipperLib.Clipper.SimplifyPolygon = function (poly, fillType)
{
  var result = new Array();
  var c = new ClipperLib.Clipper(0);
  c.StrictlySimple = true;
  c.AddPath(poly, ClipperLib.PolyType.ptSubject, true);
  c.Execute(ClipperLib.ClipType.ctUnion, result, fillType, fillType);
  return result;
};
ClipperLib.Clipper.SimplifyPolygons = function (polys, fillType)
{
  if (typeof (fillType) == "undefined") fillType = ClipperLib.PolyFillType.pftEvenOdd;
  var result = new Array();
  var c = new ClipperLib.Clipper(0);
  c.StrictlySimple = true;
  c.AddPaths(polys, ClipperLib.PolyType.ptSubject, true);
  c.Execute(ClipperLib.ClipType.ctUnion, result, fillType, fillType);
  return result;
};
ClipperLib.Clipper.DistanceSqrd = function (pt1, pt2)
{
  var dx = (pt1.X - pt2.X);
  var dy = (pt1.Y - pt2.Y);
  return (dx * dx + dy * dy);
};
ClipperLib.Clipper.DistanceFromLineSqrd = function (pt, ln1, ln2)
{
  //The equation of a line in general form (Ax + By + C = 0)
  //given 2 points (x�,y�) & (x�,y�) is ...
  //(y� - y�)x + (x� - x�)y + (y� - y�)x� - (x� - x�)y� = 0
  //A = (y� - y�); B = (x� - x�); C = (y� - y�)x� - (x� - x�)y�
  //perpendicular distance of point (x�,y�) = (Ax� + By� + C)/Sqrt(A� + B�)
  //see http://en.wikipedia.org/wiki/Perpendicular_distance
  var A = ln1.Y - ln2.Y;
  var B = ln2.X - ln1.X;
  var C = A * ln1.X + B * ln1.Y;
  C = A * pt.X + B * pt.Y - C;
  return (C * C) / (A * A + B * B);
};
ClipperLib.Clipper.SlopesNearCollinear = function (pt1, pt2, pt3, distSqrd)
{
  return ClipperLib.Clipper.DistanceFromLineSqrd(pt2, pt1, pt3) < distSqrd;
};
ClipperLib.Clipper.PointsAreClose = function (pt1, pt2, distSqrd)
{
  var dx = pt1.X - pt2.X;
  var dy = pt1.Y - pt2.Y;
  return ((dx * dx) + (dy * dy) <= distSqrd);
};
//------------------------------------------------------------------------------
ClipperLib.Clipper.ExcludeOp = function (op)
{
  var result = op.Prev;
  result.Next = op.Next;
  op.Next.Prev = result;
  result.Idx = 0;
  return result;
};
ClipperLib.Clipper.CleanPolygon = function (path, distance)
{
  if (typeof (distance) == "undefined") distance = 1.415;
  //distance = proximity in units/pixels below which vertices will be stripped. 
  //Default ~= sqrt(2) so when adjacent vertices or semi-adjacent vertices have 
  //both x & y coords within 1 unit, then the second vertex will be stripped.
  var cnt = path.length;
  if (cnt == 0)
    return new Array();
  var outPts = new Array(cnt);
  for (var i = 0; i < cnt; ++i)
    outPts[i] = new ClipperLib.OutPt();
  for (var i = 0; i < cnt; ++i)
  {
    outPts[i].Pt = path[i];
    outPts[i].Next = outPts[(i + 1) % cnt];
    outPts[i].Next.Prev = outPts[i];
    outPts[i].Idx = 0;
  }
  var distSqrd = distance * distance;
  var op = outPts[0];
  while (op.Idx == 0 && op.Next != op.Prev)
  {
    if (ClipperLib.Clipper.PointsAreClose(op.Pt, op.Prev.Pt, distSqrd))
    {
      op = ClipperLib.Clipper.ExcludeOp(op);
      cnt--;
    }
    else if (ClipperLib.Clipper.PointsAreClose(op.Prev.Pt, op.Next.Pt, distSqrd))
    {
      ClipperLib.Clipper.ExcludeOp(op.Next);
      op = ClipperLib.Clipper.ExcludeOp(op);
      cnt -= 2;
    }
    else if (ClipperLib.Clipper.SlopesNearCollinear(op.Prev.Pt, op.Pt, op.Next.Pt, distSqrd))
    {
      op = ClipperLib.Clipper.ExcludeOp(op);
      cnt--;
    }
    else
    {
      op.Idx = 1;
      op = op.Next;
    }
  }
  if (cnt < 3)
    cnt = 0;
  var result = new Array(cnt);
  for (var i = 0; i < cnt; ++i)
  {
    result[i] = new ClipperLib.IntPoint(op.Pt);
    op = op.Next;
  }
  outPts = null;
  return result;
};
ClipperLib.Clipper.CleanPolygons = function (polys, distance)
{
  var result = new Array(polys.length);
  for (var i = 0, ilen = polys.length; i < ilen; i++)
    result[i] = ClipperLib.Clipper.CleanPolygon(polys[i], distance);
  return result;
};
ClipperLib.Clipper.Minkowski = function (pattern, path, IsSum, IsClosed)
{
  var delta = (IsClosed ? 1 : 0);
  var polyCnt = pattern.length;
  var pathCnt = path.length;
  var result = new Array();
  if (IsSum)
    for (var i = 0; i < pathCnt; i++)
    {
      var p = new Array(polyCnt);
      for (var j = 0, jlen = pattern.length, ip = pattern[j]; j < jlen; j++, ip = pattern[j])
        p[j] = new ClipperLib.IntPoint(path[i].X + ip.X, path[i].Y + ip.Y);
      result.push(p);
    }
  else
    for (var i = 0; i < pathCnt; i++)
    {
      var p = new Array(polyCnt);
      for (var j = 0, jlen = pattern.length, ip = pattern[j]; j < jlen; j++, ip = pattern[j])
        p[j] = new ClipperLib.IntPoint(path[i].X - ip.X, path[i].Y - ip.Y);
      result.push(p);
    }
  var quads = new Array();
  for (var i = 0; i < pathCnt - 1 + delta; i++)
    for (var j = 0; j < polyCnt; j++)
    {
      var quad = new Array();
      quad.push(result[i % pathCnt][j % polyCnt]);
      quad.push(result[(i + 1) % pathCnt][j % polyCnt]);
      quad.push(result[(i + 1) % pathCnt][(j + 1) % polyCnt]);
      quad.push(result[i % pathCnt][(j + 1) % polyCnt]);
      if (!ClipperLib.Clipper.Orientation(quad))
        quad.reverse();
      quads.push(quad);
    }
  var c = new ClipperLib.Clipper(0);
  c.AddPaths(quads, ClipperLib.PolyType.ptSubject, true);
  c.Execute(ClipperLib.ClipType.ctUnion, result, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
  return result;
};

ClipperLib.Clipper.MinkowskiSum = function ()
{
  var a = arguments,
    alen = a.length;
  if (alen == 3) // MinkowskiSum(Path pattern, path, pathIsClosed)
  {
    var pattern = a[0],
      path = a[1],
      pathIsClosed = a[2];
    return ClipperLib.Clipper.Minkowski(pattern, path, true, pathIsClosed);
  }
  else if (alen == 4) // MinkowskiSum(pattern, paths, pathFillType, pathIsClosed)
  {
    var pattern = a[0],
      paths = a[1],
      pathFillType = a[2],
      pathIsClosed = a[3];
    var c = new ClipperLib.Clipper(),
      tmp;
    for (var i = 0, ilen = paths.length; i < ilen; ++i)
    {
      var tmp = ClipperLib.Clipper.Minkowski(pattern, paths[i], true, pathIsClosed);
      c.AddPaths(tmp, ClipperLib.PolyType.ptSubject, true);
    }
    if (pathIsClosed) c.AddPaths(paths, ClipperLib.PolyType.ptClip, true);
    var solution = new ClipperLib.Paths();
    c.Execute(ClipperLib.ClipType.ctUnion, solution, pathFillType, pathFillType);
    return solution;
  }
};

ClipperLib.Clipper.MinkowskiDiff = function (pattern, path, pathIsClosed)
{
  return ClipperLib.Clipper.Minkowski(pattern, path, false, pathIsClosed);
};

ClipperLib.Clipper.PolyTreeToPaths = function (polytree)
{
  var result = new Array();
  //result.set_Capacity(polytree.get_Total());
  ClipperLib.Clipper.AddPolyNodeToPaths(polytree, ClipperLib.Clipper.NodeType.ntAny, result);
  return result;
};
ClipperLib.Clipper.AddPolyNodeToPaths = function (polynode, nt, paths)
{
  var match = true;
  switch (nt)
  {
  case ClipperLib.Clipper.NodeType.ntOpen:
    return;
  case ClipperLib.Clipper.NodeType.ntClosed:
    match = !polynode.IsOpen;
    break;
  default:
    break;
  }
  if (polynode.m_polygon.length > 0 && match)
    paths.push(polynode.m_polygon);
  for (var $i3 = 0, $t3 = polynode.Childs(), $l3 = $t3.length, pn = $t3[$i3]; $i3 < $l3; $i3++, pn = $t3[$i3])
    ClipperLib.Clipper.AddPolyNodeToPaths(pn, nt, paths);
};
ClipperLib.Clipper.OpenPathsFromPolyTree = function (polytree)
{
  var result = new ClipperLib.Paths();
  //result.set_Capacity(polytree.ChildCount());
  for (var i = 0, ilen = polytree.ChildCount(); i < ilen; i++)
    if (polytree.Childs()[i].IsOpen)
      result.push(polytree.Childs()[i].m_polygon);
  return result;
};
ClipperLib.Clipper.ClosedPathsFromPolyTree = function (polytree)
{
  var result = new ClipperLib.Paths();
  //result.set_Capacity(polytree.Total());
  ClipperLib.Clipper.AddPolyNodeToPaths(polytree, ClipperLib.Clipper.NodeType.ntClosed, result);
  return result;
};
Inherit(ClipperLib.Clipper, ClipperLib.ClipperBase);
ClipperLib.Clipper.NodeType = {
  ntAny: 0,
  ntOpen: 1,
  ntClosed: 2
};
ClipperLib.ClipperOffset = function (miterLimit, arcTolerance)
{
  if (typeof (miterLimit) == "undefined") miterLimit = 2;
  if (typeof (arcTolerance) == "undefined") arcTolerance = ClipperLib.ClipperOffset.def_arc_tolerance;
  this.m_destPolys = new ClipperLib.Paths();
  this.m_srcPoly = new ClipperLib.Path();
  this.m_destPoly = new ClipperLib.Path();
  this.m_normals = new Array();
  this.m_delta = 0;
  this.m_sinA = 0;
  this.m_sin = 0;
  this.m_cos = 0;
  this.m_miterLim = 0;
  this.m_StepsPerRad = 0;
  this.m_lowest = new ClipperLib.IntPoint();
  this.m_polyNodes = new ClipperLib.PolyNode();
  this.MiterLimit = miterLimit;
  this.ArcTolerance = arcTolerance;
  this.m_lowest.X = -1;
};
ClipperLib.ClipperOffset.two_pi = 6.28318530717959;
ClipperLib.ClipperOffset.def_arc_tolerance = 0.25;
ClipperLib.ClipperOffset.prototype.Clear = function ()
{
  ClipperLib.Clear(this.m_polyNodes.Childs());
  this.m_lowest.X = -1;
};
ClipperLib.ClipperOffset.Round = ClipperLib.Clipper.Round;
ClipperLib.ClipperOffset.prototype.AddPath = function (path, joinType, endType)
{
  var highI = path.length - 1;
  if (highI < 0)
    return;
  var newNode = new ClipperLib.PolyNode();
  newNode.m_jointype = joinType;
  newNode.m_endtype = endType;
  //strip duplicate points from path and also get index to the lowest point ...
  if (endType == ClipperLib.EndType.etClosedLine || endType == ClipperLib.EndType.etClosedPolygon)
    while (highI > 0 && ClipperLib.IntPoint.op_Equality(path[0], path[highI]))
      highI--;
  //newNode.m_polygon.set_Capacity(highI + 1);
  newNode.m_polygon.push(path[0]);
  var j = 0,
    k = 0;
  for (var i = 1; i <= highI; i++)
    if (ClipperLib.IntPoint.op_Inequality(newNode.m_polygon[j], path[i]))
    {
      j++;
      newNode.m_polygon.push(path[i]);
      if (path[i].Y > newNode.m_polygon[k].Y || (path[i].Y == newNode.m_polygon[k].Y && path[i].X < newNode.m_polygon[k].X))
        k = j;
    }
  if ((endType == ClipperLib.EndType.etClosedPolygon && j < 2) || (endType != ClipperLib.EndType.etClosedPolygon && j < 0))
    return;
  this.m_polyNodes.AddChild(newNode);
  //if this path's lowest pt is lower than all the others then update m_lowest
  if (endType != ClipperLib.EndType.etClosedPolygon)
    return;
  if (this.m_lowest.X < 0)
    this.m_lowest = new ClipperLib.IntPoint(0, k);
  else
  {
    var ip = this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon[this.m_lowest.Y];
    if (newNode.m_polygon[k].Y > ip.Y || (newNode.m_polygon[k].Y == ip.Y && newNode.m_polygon[k].X < ip.X))
      this.m_lowest = new ClipperLib.IntPoint(this.m_polyNodes.ChildCount() - 1, k);
  }
};
ClipperLib.ClipperOffset.prototype.AddPaths = function (paths, joinType, endType)
{
  for (var i = 0, ilen = paths.length; i < ilen; i++)
    this.AddPath(paths[i], joinType, endType);
};
ClipperLib.ClipperOffset.prototype.FixOrientations = function ()
{
  //fixup orientations of all closed paths if the orientation of the
  //closed path with the lowermost vertex is wrong ...
  if (this.m_lowest.X >= 0 && !ClipperLib.Clipper.Orientation(this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon))
  {
    for (var i = 0; i < this.m_polyNodes.ChildCount(); i++)
    {
      var node = this.m_polyNodes.Childs()[i];
      if (node.m_endtype == ClipperLib.EndType.etClosedPolygon || (node.m_endtype == ClipperLib.EndType.etClosedLine && ClipperLib.Clipper.Orientation(node.m_polygon)))
        node.m_polygon.reverse();
    }
  }
  else
  {
    for (var i = 0; i < this.m_polyNodes.ChildCount(); i++)
    {
      var node = this.m_polyNodes.Childs()[i];
      if (node.m_endtype == ClipperLib.EndType.etClosedLine && !ClipperLib.Clipper.Orientation(node.m_polygon))
        node.m_polygon.reverse();
    }
  }
};
ClipperLib.ClipperOffset.GetUnitNormal = function (pt1, pt2)
{
  var dx = (pt2.X - pt1.X);
  var dy = (pt2.Y - pt1.Y);
  if ((dx == 0) && (dy == 0))
    return new ClipperLib.DoublePoint(0, 0);
  var f = 1 / Math.sqrt(dx * dx + dy * dy);
  dx *= f;
  dy *= f;
  return new ClipperLib.DoublePoint(dy, -dx);
};
ClipperLib.ClipperOffset.prototype.DoOffset = function (delta)
{
  this.m_destPolys = new Array();
  this.m_delta = delta;
  //if Zero offset, just copy any CLOSED polygons to m_p and return ...
  if (ClipperLib.ClipperBase.near_zero(delta))
  {
    //this.m_destPolys.set_Capacity(this.m_polyNodes.ChildCount);
    for (var i = 0; i < this.m_polyNodes.ChildCount(); i++)
    {
      var node = this.m_polyNodes.Childs()[i];
      if (node.m_endtype == ClipperLib.EndType.etClosedPolygon)
        this.m_destPolys.push(node.m_polygon);
    }
    return;
  }
  //see offset_triginometry3.svg in the documentation folder ...
  if (this.MiterLimit > 2)
    this.m_miterLim = 2 / (this.MiterLimit * this.MiterLimit);
  else
    this.m_miterLim = 0.5;
  var y;
  if (this.ArcTolerance <= 0)
    y = ClipperLib.ClipperOffset.def_arc_tolerance;
  else if (this.ArcTolerance > Math.abs(delta) * ClipperLib.ClipperOffset.def_arc_tolerance)
    y = Math.abs(delta) * ClipperLib.ClipperOffset.def_arc_tolerance;
  else
    y = this.ArcTolerance;
  //see offset_triginometry2.svg in the documentation folder ...
  var steps = 3.14159265358979 / Math.acos(1 - y / Math.abs(delta));
  this.m_sin = Math.sin(ClipperLib.ClipperOffset.two_pi / steps);
  this.m_cos = Math.cos(ClipperLib.ClipperOffset.two_pi / steps);
  this.m_StepsPerRad = steps / ClipperLib.ClipperOffset.two_pi;
  if (delta < 0)
    this.m_sin = -this.m_sin;
  //this.m_destPolys.set_Capacity(this.m_polyNodes.ChildCount * 2);
  for (var i = 0; i < this.m_polyNodes.ChildCount(); i++)
  {
    var node = this.m_polyNodes.Childs()[i];
    this.m_srcPoly = node.m_polygon;
    var len = this.m_srcPoly.length;
    if (len == 0 || (delta <= 0 && (len < 3 || node.m_endtype != ClipperLib.EndType.etClosedPolygon)))
      continue;
    this.m_destPoly = new Array();
    if (len == 1)
    {
      if (node.m_jointype == ClipperLib.JoinType.jtRound)
      {
        var X = 1,
          Y = 0;
        for (var j = 1; j <= steps; j++)
        {
          this.m_destPoly.push(new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + Y * delta)));
          var X2 = X;
          X = X * this.m_cos - this.m_sin * Y;
          Y = X2 * this.m_sin + Y * this.m_cos;
        }
      }
      else
      {
        var X = -1,
          Y = -1;
        for (var j = 0; j < 4; ++j)
        {
          this.m_destPoly.push(new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + Y * delta)));
          if (X < 0)
            X = 1;
          else if (Y < 0)
            Y = 1;
          else
            X = -1;
        }
      }
      this.m_destPolys.push(this.m_destPoly);
      continue;
    }
    //build m_normals ...
    this.m_normals.length = 0;
    //this.m_normals.set_Capacity(len);
    for (var j = 0; j < len - 1; j++)
      this.m_normals.push(ClipperLib.ClipperOffset.GetUnitNormal(this.m_srcPoly[j], this.m_srcPoly[j + 1]));
    if (node.m_endtype == ClipperLib.EndType.etClosedLine || node.m_endtype == ClipperLib.EndType.etClosedPolygon)
      this.m_normals.push(ClipperLib.ClipperOffset.GetUnitNormal(this.m_srcPoly[len - 1], this.m_srcPoly[0]));
    else
      this.m_normals.push(new ClipperLib.DoublePoint(this.m_normals[len - 2]));
    if (node.m_endtype == ClipperLib.EndType.etClosedPolygon)
    {
      var k = len - 1;
      for (var j = 0; j < len; j++)
        k = this.OffsetPoint(j, k, node.m_jointype);
      this.m_destPolys.push(this.m_destPoly);
    }
    else if (node.m_endtype == ClipperLib.EndType.etClosedLine)
    {
      var k = len - 1;
      for (var j = 0; j < len; j++)
        k = this.OffsetPoint(j, k, node.m_jointype);
      this.m_destPolys.push(this.m_destPoly);
      this.m_destPoly = new Array();
      //re-build m_normals ...
      var n = this.m_normals[len - 1];
      for (var j = len - 1; j > 0; j--)
        this.m_normals[j] = new ClipperLib.DoublePoint(-this.m_normals[j - 1].X, -this.m_normals[j - 1].Y);
      this.m_normals[0] = new ClipperLib.DoublePoint(-n.X, -n.Y);
      k = 0;
      for (var j = len - 1; j >= 0; j--)
        k = this.OffsetPoint(j, k, node.m_jointype);
      this.m_destPolys.push(this.m_destPoly);
    }
    else
    {
      var k = 0;
      for (var j = 1; j < len - 1; ++j)
        k = this.OffsetPoint(j, k, node.m_jointype);
      var pt1;
      if (node.m_endtype == ClipperLib.EndType.etOpenButt)
      {
        var j = len - 1;
        pt1 = new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * delta));
        this.m_destPoly.push(pt1);
        pt1 = new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X - this.m_normals[j].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y - this.m_normals[j].Y * delta));
        this.m_destPoly.push(pt1);
      }
      else
      {
        var j = len - 1;
        k = len - 2;
        this.m_sinA = 0;
        this.m_normals[j] = new ClipperLib.DoublePoint(-this.m_normals[j].X, -this.m_normals[j].Y);
        if (node.m_endtype == ClipperLib.EndType.etOpenSquare)
          this.DoSquare(j, k);
        else
          this.DoRound(j, k);
      }
      //re-build m_normals ...
      for (var j = len - 1; j > 0; j--)
        this.m_normals[j] = new ClipperLib.DoublePoint(-this.m_normals[j - 1].X, -this.m_normals[j - 1].Y);
      this.m_normals[0] = new ClipperLib.DoublePoint(-this.m_normals[1].X, -this.m_normals[1].Y);
      k = len - 1;
      for (var j = k - 1; j > 0; --j)
        k = this.OffsetPoint(j, k, node.m_jointype);
      if (node.m_endtype == ClipperLib.EndType.etOpenButt)
      {
        pt1 = new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X - this.m_normals[0].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y - this.m_normals[0].Y * delta));
        this.m_destPoly.push(pt1);
        pt1 = new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + this.m_normals[0].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + this.m_normals[0].Y * delta));
        this.m_destPoly.push(pt1);
      }
      else
      {
        k = 1;
        this.m_sinA = 0;
        if (node.m_endtype == ClipperLib.EndType.etOpenSquare)
          this.DoSquare(0, 1);
        else
          this.DoRound(0, 1);
      }
      this.m_destPolys.push(this.m_destPoly);
    }
  }
};
ClipperLib.ClipperOffset.prototype.Execute = function ()
{
  var a = arguments,
    ispolytree = a[0] instanceof ClipperLib.PolyTree;
  if (!ispolytree) // function (solution, delta)
  {
    var solution = a[0],
      delta = a[1];
    ClipperLib.Clear(solution);
    this.FixOrientations();
    this.DoOffset(delta);
    //now clean up 'corners' ...
    var clpr = new ClipperLib.Clipper(0);
    clpr.AddPaths(this.m_destPolys, ClipperLib.PolyType.ptSubject, true);
    if (delta > 0)
    {
      clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftPositive, ClipperLib.PolyFillType.pftPositive);
    }
    else
    {
      var r = ClipperLib.Clipper.GetBounds(this.m_destPolys);
      var outer = new ClipperLib.Path();
      outer.push(new ClipperLib.IntPoint(r.left - 10, r.bottom + 10));
      outer.push(new ClipperLib.IntPoint(r.right + 10, r.bottom + 10));
      outer.push(new ClipperLib.IntPoint(r.right + 10, r.top - 10));
      outer.push(new ClipperLib.IntPoint(r.left - 10, r.top - 10));
      clpr.AddPath(outer, ClipperLib.PolyType.ptSubject, true);
      clpr.ReverseSolution = true;
      clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNegative, ClipperLib.PolyFillType.pftNegative);
      if (solution.length > 0)
        solution.splice(0, 1);
    }
    //console.log(JSON.stringify(solution));
  }
  else // function (polytree, delta)
  {
    var solution = a[0],
      delta = a[1];
    solution.Clear();
    this.FixOrientations();
    this.DoOffset(delta);
    //now clean up 'corners' ...
    var clpr = new ClipperLib.Clipper(0);
    clpr.AddPaths(this.m_destPolys, ClipperLib.PolyType.ptSubject, true);
    if (delta > 0)
    {
      clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftPositive, ClipperLib.PolyFillType.pftPositive);
    }
    else
    {
      var r = ClipperLib.Clipper.GetBounds(this.m_destPolys);
      var outer = new ClipperLib.Path();
      outer.push(new ClipperLib.IntPoint(r.left - 10, r.bottom + 10));
      outer.push(new ClipperLib.IntPoint(r.right + 10, r.bottom + 10));
      outer.push(new ClipperLib.IntPoint(r.right + 10, r.top - 10));
      outer.push(new ClipperLib.IntPoint(r.left - 10, r.top - 10));
      clpr.AddPath(outer, ClipperLib.PolyType.ptSubject, true);
      clpr.ReverseSolution = true;
      clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNegative, ClipperLib.PolyFillType.pftNegative);
      //remove the outer PolyNode rectangle ...
      if (solution.ChildCount() == 1 && solution.Childs()[0].ChildCount() > 0)
      {
        var outerNode = solution.Childs()[0];
        //solution.Childs.set_Capacity(outerNode.ChildCount);
        solution.Childs()[0] = outerNode.Childs()[0];
        for (var i = 1; i < outerNode.ChildCount(); i++)
          solution.AddChild(outerNode.Childs()[i]);
      }
      else
        solution.Clear();
    }
  }
};
ClipperLib.ClipperOffset.prototype.OffsetPoint = function (j, k, jointype)
{
  this.m_sinA = (this.m_normals[k].X * this.m_normals[j].Y - this.m_normals[j].X * this.m_normals[k].Y);
  if (this.m_sinA < 0.00005 && this.m_sinA > -0.00005)
    return k;
  else if (this.m_sinA > 1)
    this.m_sinA = 1.0;
  else if (this.m_sinA < -1)
    this.m_sinA = -1.0;
  if (this.m_sinA * this.m_delta < 0)
  {
    this.m_destPoly.push(new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[k].X * this.m_delta),
      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[k].Y * this.m_delta)));
    this.m_destPoly.push(new ClipperLib.IntPoint(this.m_srcPoly[j]));
    this.m_destPoly.push(new ClipperLib.IntPoint(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * this.m_delta),
      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * this.m_delta)));
  }
  else
    switch (jointype)
    {
    case ClipperLib.JoinType.jtMiter:
      {
        var r = 1 + (this.m_normals[j].X * this.m_normals[k].X + this.m_normals[j].Y * this.m_normals[k].Y);
        if (r >= this.m_miterLim)
          this.DoMiter(j, k, r);
        else
          this.DoSquare(j, k);
        break;
      }
    case ClipperLib.JoinType.jtSquare:
      this.DoSquare(j, k);
      break;
    case ClipperLib.JoinType.jtRound:
      this.DoRound(j, k);
      break;
    }
  k = j;
  return k;
};
ClipperLib.ClipperOffset.prototype.DoSquare = function (j, k)
{
  var dx = Math.tan(Math.atan2(this.m_sinA,
    this.m_normals[k].X * this.m_normals[j].X + this.m_normals[k].Y * this.m_normals[j].Y) / 4);
  this.m_destPoly.push(new ClipperLib.IntPoint(
    ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_delta * (this.m_normals[k].X - this.m_normals[k].Y * dx)),
    ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_delta * (this.m_normals[k].Y + this.m_normals[k].X * dx))));
  this.m_destPoly.push(new ClipperLib.IntPoint(
    ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_delta * (this.m_normals[j].X + this.m_normals[j].Y * dx)),
    ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_delta * (this.m_normals[j].Y - this.m_normals[j].X * dx))));
};
ClipperLib.ClipperOffset.prototype.DoMiter = function (j, k, r)
{
  var q = this.m_delta / r;
  this.m_destPoly.push(new ClipperLib.IntPoint(
    ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + (this.m_normals[k].X + this.m_normals[j].X) * q),
    ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + (this.m_normals[k].Y + this.m_normals[j].Y) * q)));
};
ClipperLib.ClipperOffset.prototype.DoRound = function (j, k)
{
  var a = Math.atan2(this.m_sinA,
    this.m_normals[k].X * this.m_normals[j].X + this.m_normals[k].Y * this.m_normals[j].Y);
  var steps = ClipperLib.Cast_Int32(ClipperLib.ClipperOffset.Round(this.m_StepsPerRad * Math.abs(a)));
  var X = this.m_normals[k].X,
    Y = this.m_normals[k].Y,
    X2;
  for (var i = 0; i < steps; ++i)
  {
    this.m_destPoly.push(new ClipperLib.IntPoint(
      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + X * this.m_delta),
      ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + Y * this.m_delta)));
    X2 = X;
    X = X * this.m_cos - this.m_sin * Y;
    Y = X2 * this.m_sin + Y * this.m_cos;
  }
  this.m_destPoly.push(new ClipperLib.IntPoint(
    ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * this.m_delta),
    ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * this.m_delta)));
};
ClipperLib.Error = function (message)
{
  try
  {
    throw new Error(message);
  }
  catch (err)
  {
    alert(err.message);
  }
};
// ---------------------------------
// JS extension by Timo 2013
ClipperLib.JS = {};
ClipperLib.JS.AreaOfPolygon = function (poly, scale)
{
  if (!scale) scale = 1;
  return ClipperLib.Clipper.Area(poly) / (scale * scale);
};
ClipperLib.JS.AreaOfPolygons = function (poly, scale)
{
  if (!scale) scale = 1;
  var area = 0;
  for (var i = 0; i < poly.length; i++)
  {
    area += ClipperLib.Clipper.Area(poly[i]);
  }
  return area / (scale * scale);
};
ClipperLib.JS.BoundsOfPath = function (path, scale)
{
  return ClipperLib.JS.BoundsOfPaths([path], scale);
};
ClipperLib.JS.BoundsOfPaths = function (paths, scale)
{
  if (!scale) scale = 1;
  var bounds = ClipperLib.Clipper.GetBounds(paths);
  bounds.left /= scale;
  bounds.bottom /= scale;
  bounds.right /= scale;
  bounds.top /= scale;
  return bounds;
};
// Clean() joins vertices that are too near each other
// and causes distortion to offsetted polygons without cleaning
ClipperLib.JS.Clean = function (polygon, delta)
{
  if (!(polygon instanceof Array)) return [];
  var isPolygons = polygon[0] instanceof Array;
  var polygon = ClipperLib.JS.Clone(polygon);
  if (typeof delta != "number" || delta === null)
  {
    ClipperLib.Error("Delta is not a number in Clean().");
    return polygon;
  }
  if (polygon.length === 0 || (polygon.length == 1 && polygon[0].length === 0) || delta < 0) return polygon;
  if (!isPolygons) polygon = [polygon];
  var k_length = polygon.length;
  var len, poly, result, d, p, j, i;
  var results = [];
  for (var k = 0; k < k_length; k++)
  {
    poly = polygon[k];
    len = poly.length;
    if (len === 0) continue;
    else if (len < 3)
    {
      result = poly;
      results.push(result);
      continue;
    }
    result = poly;
    d = delta * delta;
    //d = Math.floor(c_delta * c_delta);
    p = poly[0];
    j = 1;
    for (i = 1; i < len; i++)
    {
      if ((poly[i].X - p.X) * (poly[i].X - p.X) +
        (poly[i].Y - p.Y) * (poly[i].Y - p.Y) <= d)
        continue;
      result[j] = poly[i];
      p = poly[i];
      j++;
    }
    p = poly[j - 1];
    if ((poly[0].X - p.X) * (poly[0].X - p.X) +
      (poly[0].Y - p.Y) * (poly[0].Y - p.Y) <= d)
      j--;
    if (j < len)
      result.splice(j, len - j);
    if (result.length) results.push(result);
  }
  if (!isPolygons && results.length) results = results[0];
  else if (!isPolygons && results.length === 0) results = [];
  else if (isPolygons && results.length === 0) results = [
    []
  ];
  return results;
}
// Make deep copy of Polygons or Polygon
// so that also IntPoint objects are cloned and not only referenced
// This should be the fastest way
ClipperLib.JS.Clone = function (polygon)
{
  if (!(polygon instanceof Array)) return [];
  if (polygon.length === 0) return [];
  else if (polygon.length == 1 && polygon[0].length === 0) return [[]];
  var isPolygons = polygon[0] instanceof Array;
  if (!isPolygons) polygon = [polygon];
  var len = polygon.length,
    plen, i, j, result;
  var results = new Array(len);
  for (i = 0; i < len; i++)
  {
    plen = polygon[i].length;
    result = new Array(plen);
    for (j = 0; j < plen; j++)
    {
      result[j] = {
        X: polygon[i][j].X,
        Y: polygon[i][j].Y
      };
    }
    results[i] = result;
  }
  if (!isPolygons) results = results[0];
  return results;
};
// Removes points that doesn't affect much to the visual appearance.
// If middle point is at or under certain distance (tolerance) of the line segment between 
// start and end point, the middle point is removed.
ClipperLib.JS.Lighten = function (polygon, tolerance)
{
  if (!(polygon instanceof Array)) return [];
  if (typeof tolerance != "number" || tolerance === null)
  {
    ClipperLib.Error("Tolerance is not a number in Lighten().")
    return ClipperLib.JS.Clone(polygon);
  }
  if (polygon.length === 0 || (polygon.length == 1 && polygon[0].length === 0) || tolerance < 0)
  {
    return ClipperLib.JS.Clone(polygon);
  }
  if (!(polygon[0] instanceof Array)) polygon = [polygon];
  var i, j, poly, k, poly2, plen, A, B, P, d, rem, addlast;
  var bxax, byay, l, ax, ay;
  var len = polygon.length;
  var toleranceSq = tolerance * tolerance;
  var results = [];
  for (i = 0; i < len; i++)
  {
    poly = polygon[i];
    plen = poly.length;
    if (plen == 0) continue;
    for (k = 0; k < 1000000; k++) // could be forever loop, but wiser to restrict max repeat count
    {
      poly2 = [];
      plen = poly.length;
      // the first have to added to the end, if first and last are not the same
      // this way we ensure that also the actual last point can be removed if needed
      if (poly[plen - 1].X != poly[0].X || poly[plen - 1].Y != poly[0].Y)
      {
        addlast = 1;
        poly.push(
        {
          X: poly[0].X,
          Y: poly[0].Y
        });
        plen = poly.length;
      }
      else addlast = 0;
      rem = []; // Indexes of removed points
      for (j = 0; j < plen - 2; j++)
      {
        A = poly[j]; // Start point of line segment
        P = poly[j + 1]; // Middle point. This is the one to be removed.
        B = poly[j + 2]; // End point of line segment
        ax = A.X;
        ay = A.Y;
        bxax = B.X - ax;
        byay = B.Y - ay;
        if (bxax !== 0 || byay !== 0) // To avoid Nan, when A==P && P==B. And to avoid peaks (A==B && A!=P), which have lenght, but not area.
        {
          l = ((P.X - ax) * bxax + (P.Y - ay) * byay) / (bxax * bxax + byay * byay);
          if (l > 1)
          {
            ax = B.X;
            ay = B.Y;
          }
          else if (l > 0)
          {
            ax += bxax * l;
            ay += byay * l;
          }
        }
        bxax = P.X - ax;
        byay = P.Y - ay;
        d = bxax * bxax + byay * byay;
        if (d <= toleranceSq)
        {
          rem[j + 1] = 1;
          j++; // when removed, transfer the pointer to the next one
        }
      }
      // add all unremoved points to poly2
      poly2.push(
      {
        X: poly[0].X,
        Y: poly[0].Y
      });
      for (j = 1; j < plen - 1; j++)
        if (!rem[j]) poly2.push(
        {
          X: poly[j].X,
          Y: poly[j].Y
        });
      poly2.push(
      {
        X: poly[plen - 1].X,
        Y: poly[plen - 1].Y
      });
      // if the first point was added to the end, remove it
      if (addlast) poly.pop();
      // break, if there was not anymore removed points
      if (!rem.length) break;
      // else continue looping using poly2, to check if there are points to remove
      else poly = poly2;
    }
    plen = poly2.length;
    // remove duplicate from end, if needed
    if (poly2[plen - 1].X == poly2[0].X && poly2[plen - 1].Y == poly2[0].Y)
    {
      poly2.pop();
    }
    if (poly2.length > 2) // to avoid two-point-polygons
      results.push(poly2);
  }
  if (!polygon[0] instanceof Array) results = results[0];
  if (typeof (results) == "undefined") results = [
    []
  ];
  return results;
}
ClipperLib.JS.PerimeterOfPath = function (path, closed, scale)
{
  if (typeof (path) == "undefined") return 0;
  var sqrt = Math.sqrt;
  var perimeter = 0.0;
  var p1, p2, p1x = 0.0,
    p1y = 0.0,
    p2x = 0.0,
    p2y = 0.0;
  var j = path.length;
  if (j < 2) return 0;
  if (closed)
  {
    path[j] = path[0];
    j++;
  }
  while (--j)
  {
    p1 = path[j];
    p1x = p1.X;
    p1y = p1.Y;
    p2 = path[j - 1];
    p2x = p2.X;
    p2y = p2.Y;
    perimeter += sqrt((p1x - p2x) * (p1x - p2x) + (p1y - p2y) * (p1y - p2y));
  }
  if (closed) path.pop();
  return perimeter / scale;
};
ClipperLib.JS.PerimeterOfPaths = function (paths, closed, scale)
{
  if (!scale) scale = 1;
  var perimeter = 0;
  for (var i = 0; i < paths.length; i++)
  {
    perimeter += ClipperLib.JS.PerimeterOfPath(paths[i], closed, scale);
  }
  return perimeter;
};
ClipperLib.JS.ScaleDownPath = function (path, scale)
{
  var i, p;
  if (!scale) scale = 1;
  i = path.length;
  while (i--)
  {
    p = path[i];
    p.X = p.X / scale;
    p.Y = p.Y / scale;
  }
};
ClipperLib.JS.ScaleDownPaths = function (paths, scale)
{
  var i, j, p, round = Math.round;
  if (!scale) scale = 1;
  i = paths.length;
  while (i--)
  {
    j = paths[i].length;
    while (j--)
    {
      p = paths[i][j];
      p.X = p.X / scale;
      p.Y = p.Y / scale;
    }
  }
};
ClipperLib.JS.ScaleUpPath = function (path, scale)
{
  var i, p, round = Math.round;
  if (!scale) scale = 1;
  i = path.length;
  while (i--)
  {
    p = path[i];
    p.X = round(p.X * scale);
    p.Y = round(p.Y * scale);
  }
};
ClipperLib.JS.ScaleUpPaths = function (paths, scale)
{
  var i, j, p, round = Math.round;
  if (!scale) scale = 1;
  i = paths.length;
  while (i--)
  {
    j = paths[i].length;
    while (j--)
    {
      p = paths[i][j];
      p.X = round(p.X * scale);
      p.Y = round(p.Y * scale);
    }
  }
};
ClipperLib.ExPolygons = function ()
{
  return [];
}
ClipperLib.ExPolygon = function ()
{
  this.outer = null;
  this.holes = null;
};
ClipperLib.JS.AddOuterPolyNodeToExPolygons = function (polynode, expolygons)
{
  var ep = new ClipperLib.ExPolygon();
  ep.outer = polynode.Contour();
  var childs = polynode.Childs();
  var ilen = childs.length;
  ep.holes = new Array(ilen);
  var node, n, i, j, childs2, jlen;
  for (i = 0; i < ilen; i++)
  {
    node = childs[i];
    ep.holes[i] = node.Contour();
    //Add outer polygons contained by (nested within) holes ...
    for (j = 0, childs2 = node.Childs(), jlen = childs2.length; j < jlen; j++)
    {
      n = childs2[j];
      ClipperLib.JS.AddOuterPolyNodeToExPolygons(n, expolygons);
    }
  }
  expolygons.push(ep);
};
ClipperLib.JS.ExPolygonsToPaths = function (expolygons)
{
  var a, i, alen, ilen;
  var paths = new ClipperLib.Paths();
  for (a = 0, alen = expolygons.length; a < alen; a++)
  {
    paths.push(expolygons[a].outer);
    for (i = 0, ilen = expolygons[a].holes.length; i < ilen; i++)
    {
      paths.push(expolygons[a].holes[i]);
    }
  }
  return paths;
}
ClipperLib.JS.PolyTreeToExPolygons = function (polytree)
{
  var expolygons = new ClipperLib.ExPolygons();
  var node, i, childs, ilen;
  for (i = 0, childs = polytree.Childs(), ilen = childs.length; i < ilen; i++)
  {
    node = childs[i];
    ClipperLib.JS.AddOuterPolyNodeToExPolygons(node, expolygons);
  }
  return expolygons;
};


module.exports = ClipperLib;
},{}],2:[function(require,module,exports){
(function (global){
/**
 * @license
 * lodash 3.7.0 (Custom Build) <https://lodash.com/>
 * Build: `lodash modern -d -o ./index.js`
 * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre-ES5 environments. */
  var undefined;

  /** Used as the semantic version number. */
  var VERSION = '3.7.0';

  /** Used to compose bitmasks for wrapper metadata. */
  var BIND_FLAG = 1,
      BIND_KEY_FLAG = 2,
      CURRY_BOUND_FLAG = 4,
      CURRY_FLAG = 8,
      CURRY_RIGHT_FLAG = 16,
      PARTIAL_FLAG = 32,
      PARTIAL_RIGHT_FLAG = 64,
      ARY_FLAG = 128,
      REARG_FLAG = 256;

  /** Used as default options for `_.trunc`. */
  var DEFAULT_TRUNC_LENGTH = 30,
      DEFAULT_TRUNC_OMISSION = '...';

  /** Used to detect when a function becomes hot. */
  var HOT_COUNT = 150,
      HOT_SPAN = 16;

  /** Used to indicate the type of lazy iteratees. */
  var LAZY_DROP_WHILE_FLAG = 0,
      LAZY_FILTER_FLAG = 1,
      LAZY_MAP_FLAG = 2;

  /** Used as the `TypeError` message for "Functions" methods. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /** Used as the internal argument placeholder. */
  var PLACEHOLDER = '__lodash_placeholder__';

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag = '[object Object]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to match empty string literals in compiled template source. */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /** Used to match HTML entities and HTML characters. */
  var reEscapedHtml = /&(?:amp|lt|gt|quot|#39|#96);/g,
      reUnescapedHtml = /[&<>"'`]/g,
      reHasEscapedHtml = RegExp(reEscapedHtml.source),
      reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

  /** Used to match template delimiters. */
  var reEscape = /<%-([\s\S]+?)%>/g,
      reEvaluate = /<%([\s\S]+?)%>/g,
      reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]+|(["'])(?:(?!\1)[^\n\\]|\\.)*?)\1\]/,
      reIsPlainProp = /^\w*$/,
      rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g;

  /**
   * Used to match `RegExp` [special characters](http://www.regular-expressions.info/characters.html#special).
   * In addition to special characters the forward slash is escaped to allow for
   * easier `eval` use and `Function` compilation.
   */
  var reRegExpChars = /[.*+?^${}()|[\]\/\\]/g,
      reHasRegExpChars = RegExp(reRegExpChars.source);

  /** Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks). */
  var reComboMark = /[\u0300-\u036f\ufe20-\ufe23]/g;

  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g;

  /** Used to match [ES template delimiters](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-template-literal-lexical-components). */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match `RegExp` flags from their coerced string values. */
  var reFlags = /\w*$/;

  /** Used to detect hexadecimal string values. */
  var reHasHexPrefix = /^0[xX]/;

  /** Used to detect host constructors (Safari > 5). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used to match latin-1 supplementary letters (excluding mathematical operators). */
  var reLatin1 = /[\xc0-\xd6\xd8-\xde\xdf-\xf6\xf8-\xff]/g;

  /** Used to ensure capturing order of template delimiters. */
  var reNoMatch = /($^)/;

  /** Used to match unescaped characters in compiled string literals. */
  var reUnescapedString = /['\n\r\u2028\u2029\\]/g;

  /** Used to match words to create compound words. */
  var reWords = (function() {
    var upper = '[A-Z\\xc0-\\xd6\\xd8-\\xde]',
        lower = '[a-z\\xdf-\\xf6\\xf8-\\xff]+';

    return RegExp(upper + '+(?=' + upper + lower + ')|' + upper + '?' + lower + '|' + upper + '+|[0-9]+', 'g');
  }());

  /** Used to detect and test for whitespace. */
  var whitespace = (
    // Basic whitespace characters.
    ' \t\x0b\f\xa0\ufeff' +

    // Line terminators.
    '\n\r\u2028\u2029' +

    // Unicode category "Zs" space separators.
    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
  );

  /** Used to assign default `context` object properties. */
  var contextProps = [
    'Array', 'ArrayBuffer', 'Date', 'Error', 'Float32Array', 'Float64Array',
    'Function', 'Int8Array', 'Int16Array', 'Int32Array', 'Math', 'Number',
    'Object', 'RegExp', 'Set', 'String', '_', 'clearTimeout', 'document',
    'isFinite', 'parseInt', 'setTimeout', 'TypeError', 'Uint8Array',
    'Uint8ClampedArray', 'Uint16Array', 'Uint32Array', 'WeakMap',
    'window'
  ];

  /** Used to make template sourceURLs easier to identify. */
  var templateCounter = -1;

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  typedArrayTags[dateTag] = typedArrayTags[errorTag] =
  typedArrayTags[funcTag] = typedArrayTags[mapTag] =
  typedArrayTags[numberTag] = typedArrayTags[objectTag] =
  typedArrayTags[regexpTag] = typedArrayTags[setTag] =
  typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

  /** Used to identify `toStringTag` values supported by `_.clone`. */
  var cloneableTags = {};
  cloneableTags[argsTag] = cloneableTags[arrayTag] =
  cloneableTags[arrayBufferTag] = cloneableTags[boolTag] =
  cloneableTags[dateTag] = cloneableTags[float32Tag] =
  cloneableTags[float64Tag] = cloneableTags[int8Tag] =
  cloneableTags[int16Tag] = cloneableTags[int32Tag] =
  cloneableTags[numberTag] = cloneableTags[objectTag] =
  cloneableTags[regexpTag] = cloneableTags[stringTag] =
  cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
  cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
  cloneableTags[errorTag] = cloneableTags[funcTag] =
  cloneableTags[mapTag] = cloneableTags[setTag] =
  cloneableTags[weakMapTag] = false;

  /** Used as an internal `_.debounce` options object by `_.throttle`. */
  var debounceOptions = {
    'leading': false,
    'maxWait': 0,
    'trailing': false
  };

  /** Used to map latin-1 supplementary letters to basic latin letters. */
  var deburredLetters = {
    '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
    '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
    '\xc7': 'C',  '\xe7': 'c',
    '\xd0': 'D',  '\xf0': 'd',
    '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
    '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
    '\xcC': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
    '\xeC': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
    '\xd1': 'N',  '\xf1': 'n',
    '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
    '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
    '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
    '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
    '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
    '\xc6': 'Ae', '\xe6': 'ae',
    '\xde': 'Th', '\xfe': 'th',
    '\xdf': 'ss'
  };

  /** Used to map characters to HTML entities. */
  var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;'
  };

  /** Used to map HTML entities to characters. */
  var htmlUnescapes = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#96;': '`'
  };

  /** Used to determine if values are of the language type `Object`. */
  var objectTypes = {
    'function': true,
    'object': true
  };

  /** Used to escape characters for inclusion in compiled string literals. */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Detect free variable `exports`. */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global && global.Object && global;

  /** Detect free variable `self`. */
  var freeSelf = objectTypes[typeof self] && self && self.Object && self;

  /** Detect free variable `window`. */
  var freeWindow = objectTypes[typeof window] && window && window.Object && window;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /**
   * Used as a reference to the global object.
   *
   * The `this` value is used if it is the global object to avoid Greasemonkey's
   * restricted `window` object, otherwise the `window` object is used.
   */
  var root = freeGlobal || ((freeWindow !== (this && this.window)) && freeWindow) || freeSelf || this;

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `compareAscending` which compares values and
   * sorts them in ascending order without guaranteeing a stable sort.
   *
   * @private
   * @param {*} value The value to compare to `other`.
   * @param {*} other The value to compare to `value`.
   * @returns {number} Returns the sort order indicator for `value`.
   */
  function baseCompareAscending(value, other) {
    if (value !== other) {
      var valIsReflexive = value === value,
          othIsReflexive = other === other;

      if (value > other || !valIsReflexive || (value === undefined && othIsReflexive)) {
        return 1;
      }
      if (value < other || !othIsReflexive || (other === undefined && valIsReflexive)) {
        return -1;
      }
    }
    return 0;
  }

  /**
   * The base implementation of `_.findIndex` and `_.findLastIndex` without
   * support for callback shorthands and `this` binding.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {Function} predicate The function invoked per iteration.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseFindIndex(array, predicate, fromRight) {
    var length = array.length,
        index = fromRight ? length : -1;

    while ((fromRight ? index-- : ++index < length)) {
      if (predicate(array[index], index, array)) {
        return index;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.indexOf` without support for binary searches.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    if (value !== value) {
      return indexOfNaN(array, fromIndex);
    }
    var index = fromIndex - 1,
        length = array.length;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.isFunction` without support for environments
   * with incorrect `typeof` results.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
   */
  function baseIsFunction(value) {
    // Avoid a Chakra JIT bug in compatibility modes of IE 11.
    // See https://github.com/jashkenas/underscore/issues/1621 for more details.
    return typeof value == 'function' || false;
  }

  /**
   * Converts `value` to a string if it is not one. An empty string is returned
   * for `null` or `undefined` values.
   *
   * @private
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   */
  function baseToString(value) {
    if (typeof value == 'string') {
      return value;
    }
    return value == null ? '' : (value + '');
  }

  /**
   * Used by `_.max` and `_.min` as the default callback for string values.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {number} Returns the code unit of the first character of the string.
   */
  function charAtCallback(string) {
    return string.charCodeAt(0);
  }

  /**
   * Used by `_.trim` and `_.trimLeft` to get the index of the first character
   * of `string` that is not found in `chars`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @param {string} chars The characters to find.
   * @returns {number} Returns the index of the first character not found in `chars`.
   */
  function charsLeftIndex(string, chars) {
    var index = -1,
        length = string.length;

    while (++index < length && chars.indexOf(string.charAt(index)) > -1) {}
    return index;
  }

  /**
   * Used by `_.trim` and `_.trimRight` to get the index of the last character
   * of `string` that is not found in `chars`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @param {string} chars The characters to find.
   * @returns {number} Returns the index of the last character not found in `chars`.
   */
  function charsRightIndex(string, chars) {
    var index = string.length;

    while (index-- && chars.indexOf(string.charAt(index)) > -1) {}
    return index;
  }

  /**
   * Used by `_.sortBy` to compare transformed elements of a collection and stable
   * sort them in ascending order.
   *
   * @private
   * @param {Object} object The object to compare to `other`.
   * @param {Object} other The object to compare to `object`.
   * @returns {number} Returns the sort order indicator for `object`.
   */
  function compareAscending(object, other) {
    return baseCompareAscending(object.criteria, other.criteria) || (object.index - other.index);
  }

  /**
   * Used by `_.sortByOrder` to compare multiple properties of each element
   * in a collection and stable sort them in the following order:
   *
   * If `orders` is unspecified, sort in ascending order for all properties.
   * Otherwise, for each property, sort in ascending order if its corresponding value in
   * orders is true, and descending order if false.
   *
   * @private
   * @param {Object} object The object to compare to `other`.
   * @param {Object} other The object to compare to `object`.
   * @param {boolean[]} orders The order to sort by for each property.
   * @returns {number} Returns the sort order indicator for `object`.
   */
  function compareMultiple(object, other, orders) {
    var index = -1,
        objCriteria = object.criteria,
        othCriteria = other.criteria,
        length = objCriteria.length,
        ordersLength = orders.length;

    while (++index < length) {
      var result = baseCompareAscending(objCriteria[index], othCriteria[index]);
      if (result) {
        if (index >= ordersLength) {
          return result;
        }
        return result * (orders[index] ? 1 : -1);
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to provide the same value for
    // `object` and `other`. See https://github.com/jashkenas/underscore/pull/1247
    // for more details.
    //
    // This also ensures a stable sort in V8 and other engines.
    // See https://code.google.com/p/v8/issues/detail?id=90 for more details.
    return object.index - other.index;
  }

  /**
   * Used by `_.deburr` to convert latin-1 supplementary letters to basic latin letters.
   *
   * @private
   * @param {string} letter The matched letter to deburr.
   * @returns {string} Returns the deburred letter.
   */
  function deburrLetter(letter) {
    return deburredLetters[letter];
  }

  /**
   * Used by `_.escape` to convert characters to HTML entities.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeHtmlChar(chr) {
    return htmlEscapes[chr];
  }

  /**
   * Used by `_.template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(chr) {
    return '\\' + stringEscapes[chr];
  }

  /**
   * Gets the index at which the first occurrence of `NaN` is found in `array`.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {number} fromIndex The index to search from.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched `NaN`, else `-1`.
   */
  function indexOfNaN(array, fromIndex, fromRight) {
    var length = array.length,
        index = fromIndex + (fromRight ? 0 : -1);

    while ((fromRight ? index-- : ++index < length)) {
      var other = array[index];
      if (other !== other) {
        return index;
      }
    }
    return -1;
  }

  /**
   * Checks if `value` is object-like.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   */
  function isObjectLike(value) {
    return !!value && typeof value == 'object';
  }

  /**
   * Used by `trimmedLeftIndex` and `trimmedRightIndex` to determine if a
   * character code is whitespace.
   *
   * @private
   * @param {number} charCode The character code to inspect.
   * @returns {boolean} Returns `true` if `charCode` is whitespace, else `false`.
   */
  function isSpace(charCode) {
    return ((charCode <= 160 && (charCode >= 9 && charCode <= 13) || charCode == 32 || charCode == 160) || charCode == 5760 || charCode == 6158 ||
      (charCode >= 8192 && (charCode <= 8202 || charCode == 8232 || charCode == 8233 || charCode == 8239 || charCode == 8287 || charCode == 12288 || charCode == 65279)));
  }

  /**
   * Replaces all `placeholder` elements in `array` with an internal placeholder
   * and returns an array of their indexes.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {*} placeholder The placeholder to replace.
   * @returns {Array} Returns the new array of placeholder indexes.
   */
  function replaceHolders(array, placeholder) {
    var index = -1,
        length = array.length,
        resIndex = -1,
        result = [];

    while (++index < length) {
      if (array[index] === placeholder) {
        array[index] = PLACEHOLDER;
        result[++resIndex] = index;
      }
    }
    return result;
  }

  /**
   * An implementation of `_.uniq` optimized for sorted arrays without support
   * for callback shorthands and `this` binding.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {Function} [iteratee] The function invoked per iteration.
   * @returns {Array} Returns the new duplicate-value-free array.
   */
  function sortedUniq(array, iteratee) {
    var seen,
        index = -1,
        length = array.length,
        resIndex = -1,
        result = [];

    while (++index < length) {
      var value = array[index],
          computed = iteratee ? iteratee(value, index, array) : value;

      if (!index || seen !== computed) {
        seen = computed;
        result[++resIndex] = value;
      }
    }
    return result;
  }

  /**
   * Used by `_.trim` and `_.trimLeft` to get the index of the first non-whitespace
   * character of `string`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {number} Returns the index of the first non-whitespace character.
   */
  function trimmedLeftIndex(string) {
    var index = -1,
        length = string.length;

    while (++index < length && isSpace(string.charCodeAt(index))) {}
    return index;
  }

  /**
   * Used by `_.trim` and `_.trimRight` to get the index of the last non-whitespace
   * character of `string`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {number} Returns the index of the last non-whitespace character.
   */
  function trimmedRightIndex(string) {
    var index = string.length;

    while (index-- && isSpace(string.charCodeAt(index))) {}
    return index;
  }

  /**
   * Used by `_.unescape` to convert HTML entities to characters.
   *
   * @private
   * @param {string} chr The matched character to unescape.
   * @returns {string} Returns the unescaped character.
   */
  function unescapeHtmlChar(chr) {
    return htmlUnescapes[chr];
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new pristine `lodash` function using the given `context` object.
   *
   * @static
   * @memberOf _
   * @category Utility
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns a new `lodash` function.
   * @example
   *
   * _.mixin({ 'foo': _.constant('foo') });
   *
   * var lodash = _.runInContext();
   * lodash.mixin({ 'bar': lodash.constant('bar') });
   *
   * _.isFunction(_.foo);
   * // => true
   * _.isFunction(_.bar);
   * // => false
   *
   * lodash.isFunction(lodash.foo);
   * // => false
   * lodash.isFunction(lodash.bar);
   * // => true
   *
   * // using `context` to mock `Date#getTime` use in `_.now`
   * var mock = _.runInContext({
   *   'Date': function() {
   *     return { 'getTime': getTimeMock };
   *   }
   * });
   *
   * // or creating a suped-up `defer` in Node.js
   * var defer = _.runInContext({ 'setTimeout': setImmediate }).defer;
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See https://es5.github.io/#x11.1.5 for more details.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references. */
    var Array = context.Array,
        Date = context.Date,
        Error = context.Error,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /** Used for native method references. */
    var arrayProto = Array.prototype,
        objectProto = Object.prototype,
        stringProto = String.prototype;

    /** Used to detect DOM support. */
    var document = (document = context.window) && document.document;

    /** Used to resolve the decompiled source of functions. */
    var fnToString = Function.prototype.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /** Used to generate unique IDs. */
    var idCounter = 0;

    /**
     * Used to resolve the [`toStringTag`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.prototype.tostring)
     * of values.
     */
    var objToString = objectProto.toString;

    /** Used to restore the original `_` reference in `_.noConflict`. */
    var oldDash = context._;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      escapeRegExp(objToString)
      .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /** Native method references. */
    var ArrayBuffer = isNative(ArrayBuffer = context.ArrayBuffer) && ArrayBuffer,
        bufferSlice = isNative(bufferSlice = ArrayBuffer && new ArrayBuffer(0).slice) && bufferSlice,
        ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        floor = Math.floor,
        getOwnPropertySymbols = isNative(getOwnPropertySymbols = Object.getOwnPropertySymbols) && getOwnPropertySymbols,
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        push = arrayProto.push,
        preventExtensions = isNative(Object.preventExtensions = Object.preventExtensions) && preventExtensions,
        propertyIsEnumerable = objectProto.propertyIsEnumerable,
        Set = isNative(Set = context.Set) && Set,
        setTimeout = context.setTimeout,
        splice = arrayProto.splice,
        Uint8Array = isNative(Uint8Array = context.Uint8Array) && Uint8Array,
        WeakMap = isNative(WeakMap = context.WeakMap) && WeakMap;

    /** Used to clone array buffers. */
    var Float64Array = (function() {
      // Safari 5 errors when using an array buffer to initialize a typed array
      // where the array buffer's `byteLength` is not a multiple of the typed
      // array's `BYTES_PER_ELEMENT`.
      try {
        var func = isNative(func = context.Float64Array) && func,
            result = new func(new ArrayBuffer(10), 0, 1) && func;
      } catch(e) {}
      return result;
    }());

    /** Used as `baseAssign`. */
    var nativeAssign = (function() {
      // Avoid `Object.assign` in Firefox 34-37 which have an early implementation
      // with a now defunct try/catch behavior. See https://bugzilla.mozilla.org/show_bug.cgi?id=1103344
      // for more details.
      //
      // Use `Object.preventExtensions` on a plain object instead of simply using
      // `Object('x')` because Chrome and IE fail to throw an error when attempting
      // to assign values to readonly indexes of strings in strict mode.
      var object = { '1': 0 },
          func = preventExtensions && isNative(func = Object.assign) && func;

      try { func(preventExtensions(object), 'xo'); } catch(e) {}
      return !object[1] && func;
    }());

    /* Native method references for those with the same name as other `lodash` methods. */
    var nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
        nativeIsFinite = context.isFinite,
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeNow = isNative(nativeNow = Date.now) && nativeNow,
        nativeNumIsFinite = isNative(nativeNumIsFinite = Number.isFinite) && nativeNumIsFinite,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used as references for `-Infinity` and `Infinity`. */
    var NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY,
        POSITIVE_INFINITY = Number.POSITIVE_INFINITY;

    /** Used as references for the maximum length and index of an array. */
    var MAX_ARRAY_LENGTH = Math.pow(2, 32) - 1,
        MAX_ARRAY_INDEX =  MAX_ARRAY_LENGTH - 1,
        HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;

    /** Used as the size, in bytes, of each `Float64Array` element. */
    var FLOAT64_BYTES_PER_ELEMENT = Float64Array ? Float64Array.BYTES_PER_ELEMENT : 0;

    /**
     * Used as the [maximum length](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.max_safe_integer)
     * of an array-like value.
     */
    var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

    /** Used to store function metadata. */
    var metaMap = WeakMap && new WeakMap;

    /** Used to lookup unminified function names. */
    var realNames = {};

    /*------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps `value` to enable implicit chaining.
     * Methods that operate on and return arrays, collections, and functions can
     * be chained together. Methods that return a boolean or single value will
     * automatically end the chain returning the unwrapped value. Explicit chaining
     * may be enabled using `_.chain`. The execution of chained methods is lazy,
     * that is, execution is deferred until `_#value` is implicitly or explicitly
     * called.
     *
     * Lazy evaluation allows several methods to support shortcut fusion. Shortcut
     * fusion is an optimization that merges iteratees to avoid creating intermediate
     * arrays and reduce the number of iteratee executions.
     *
     * Chaining is supported in custom builds as long as the `_#value` method is
     * directly or indirectly included in the build.
     *
     * In addition to lodash methods, wrappers have `Array` and `String` methods.
     *
     * The wrapper `Array` methods are:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`,
     * `splice`, and `unshift`
     *
     * The wrapper `String` methods are:
     * `replace` and `split`
     *
     * The wrapper methods that support shortcut fusion are:
     * `compact`, `drop`, `dropRight`, `dropRightWhile`, `dropWhile`, `filter`,
     * `first`, `initial`, `last`, `map`, `pluck`, `reject`, `rest`, `reverse`,
     * `slice`, `take`, `takeRight`, `takeRightWhile`, `takeWhile`, `toArray`,
     * and `where`
     *
     * The chainable wrapper methods are:
     * `after`, `ary`, `assign`, `at`, `before`, `bind`, `bindAll`, `bindKey`,
     * `callback`, `chain`, `chunk`, `commit`, `compact`, `concat`, `constant`,
     * `countBy`, `create`, `curry`, `debounce`, `defaults`, `defer`, `delay`,
     * `difference`, `drop`, `dropRight`, `dropRightWhile`, `dropWhile`, `fill`,
     * `filter`, `flatten`, `flattenDeep`, `flow`, `flowRight`, `forEach`,
     * `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`, `functions`,
     * `groupBy`, `indexBy`, `initial`, `intersection`, `invert`, `invoke`, `keys`,
     * `keysIn`, `map`, `mapValues`, `matches`, `matchesProperty`, `memoize`,
     * `merge`, `mixin`, `negate`, `omit`, `once`, `pairs`, `partial`, `partialRight`,
     * `partition`, `pick`, `plant`, `pluck`, `property`, `propertyOf`, `pull`,
     * `pullAt`, `push`, `range`, `rearg`, `reject`, `remove`, `rest`, `reverse`,
     * `shuffle`, `slice`, `sort`, `sortBy`, `sortByAll`, `sortByOrder`, `splice`,
     * `spread`, `take`, `takeRight`, `takeRightWhile`, `takeWhile`, `tap`,
     * `throttle`, `thru`, `times`, `toArray`, `toPlainObject`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `valuesIn`, `where`,
     * `without`, `wrap`, `xor`, `zip`, and `zipObject`
     *
     * The wrapper methods that are **not** chainable by default are:
     * `add`, `attempt`, `camelCase`, `capitalize`, `clone`, `cloneDeep`, `deburr`,
     * `endsWith`, `escape`, `escapeRegExp`, `every`, `find`, `findIndex`, `findKey`,
     * `findLast`, `findLastIndex`, `findLastKey`, `findWhere`, `first`, `has`,
     * `identity`, `includes`, `indexOf`, `inRange`, `isArguments`, `isArray`,
     * `isBoolean`, `isDate`, `isElement`, `isEmpty`, `isEqual`, `isError`, `isFinite`
     * `isFunction`, `isMatch`, `isNative`, `isNaN`, `isNull`, `isNumber`, `isObject`,
     * `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `isTypedArray`,
     * `join`, `kebabCase`, `last`, `lastIndexOf`, `max`, `min`, `noConflict`,
     * `noop`, `now`, `pad`, `padLeft`, `padRight`, `parseInt`, `pop`, `random`,
     * `reduce`, `reduceRight`, `repeat`, `result`, `runInContext`, `shift`, `size`,
     * `snakeCase`, `some`, `sortedIndex`, `sortedLastIndex`, `startCase`, `startsWith`,
     * `sum`, `template`, `trim`, `trimLeft`, `trimRight`, `trunc`, `unescape`,
     * `uniqueId`, `value`, and `words`
     *
     * The wrapper method `sample` will return a wrapped value when `n` is provided,
     * otherwise an unwrapped value is returned.
     *
     * @name _
     * @constructor
     * @category Chain
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(total, n) {
     *   return total + n;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(n) {
     *   return n * n;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      if (isObjectLike(value) && !isArray(value) && !(value instanceof LazyWrapper)) {
        if (value instanceof LodashWrapper) {
          return value;
        }
        if (hasOwnProperty.call(value, '__chain__') && hasOwnProperty.call(value, '__wrapped__')) {
          return wrapperClone(value);
        }
      }
      return new LodashWrapper(value);
    }

    /**
     * The function whose prototype all chaining wrappers inherit from.
     *
     * @private
     */
    function baseLodash() {
      // No operation performed.
    }

    /**
     * The base constructor for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap.
     * @param {boolean} [chainAll] Enable chaining for all wrapper methods.
     * @param {Array} [actions=[]] Actions to peform to resolve the unwrapped value.
     */
    function LodashWrapper(value, chainAll, actions) {
      this.__wrapped__ = value;
      this.__actions__ = actions || [];
      this.__chain__ = !!chainAll;
    }

    /**
     * An object environment feature flags.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    (function(x) {
      var Ctor = function() { this.x = x; },
          object = { '0': x, 'length': x },
          props = [];

      Ctor.prototype = { 'valueOf': x, 'y': x };
      for (var key in new Ctor) { props.push(key); }

      /**
       * Detect if functions can be decompiled by `Function#toString`
       * (all but Firefox OS certified apps, older Opera mobile browsers, and
       * the PlayStation 3; forced `false` for Windows 8 apps).
       *
       * @memberOf _.support
       * @type boolean
       */
      support.funcDecomp = /\bthis\b/.test(function() { return this; });

      /**
       * Detect if `Function#name` is supported (all but IE).
       *
       * @memberOf _.support
       * @type boolean
       */
      support.funcNames = typeof Function.name == 'string';

      /**
       * Detect if the DOM is supported.
       *
       * @memberOf _.support
       * @type boolean
       */
      try {
        support.dom = document.createDocumentFragment().nodeType === 11;
      } catch(e) {
        support.dom = false;
      }

      /**
       * Detect if `arguments` object indexes are non-enumerable.
       *
       * In Firefox < 4, IE < 9, PhantomJS, and Safari < 5.1 `arguments` object
       * indexes are non-enumerable. Chrome < 25 and Node.js < 0.11.0 treat
       * `arguments` object indexes as non-enumerable and fail `hasOwnProperty`
       * checks for indexes that exceed the number of function parameters and
       * whose associated argument values are `0`.
       *
       * @memberOf _.support
       * @type boolean
       */
      try {
        support.nonEnumArgs = !propertyIsEnumerable.call(arguments, 1);
      } catch(e) {
        support.nonEnumArgs = true;
      }
    }(1, 0));

    /**
     * By default, the template delimiters used by lodash are like those in
     * embedded Ruby (ERB). Change the following template settings to use
     * alternative delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': reEscape,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': reEvaluate,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*------------------------------------------------------------------------*/

    /**
     * Creates a lazy wrapper object which wraps `value` to enable lazy evaluation.
     *
     * @private
     * @param {*} value The value to wrap.
     */
    function LazyWrapper(value) {
      this.__wrapped__ = value;
      this.__actions__ = null;
      this.__dir__ = 1;
      this.__dropCount__ = 0;
      this.__filtered__ = false;
      this.__iteratees__ = null;
      this.__takeCount__ = POSITIVE_INFINITY;
      this.__views__ = null;
    }

    /**
     * Creates a clone of the lazy wrapper object.
     *
     * @private
     * @name clone
     * @memberOf LazyWrapper
     * @returns {Object} Returns the cloned `LazyWrapper` object.
     */
    function lazyClone() {
      var actions = this.__actions__,
          iteratees = this.__iteratees__,
          views = this.__views__,
          result = new LazyWrapper(this.__wrapped__);

      result.__actions__ = actions ? arrayCopy(actions) : null;
      result.__dir__ = this.__dir__;
      result.__filtered__ = this.__filtered__;
      result.__iteratees__ = iteratees ? arrayCopy(iteratees) : null;
      result.__takeCount__ = this.__takeCount__;
      result.__views__ = views ? arrayCopy(views) : null;
      return result;
    }

    /**
     * Reverses the direction of lazy iteration.
     *
     * @private
     * @name reverse
     * @memberOf LazyWrapper
     * @returns {Object} Returns the new reversed `LazyWrapper` object.
     */
    function lazyReverse() {
      if (this.__filtered__) {
        var result = new LazyWrapper(this);
        result.__dir__ = -1;
        result.__filtered__ = true;
      } else {
        result = this.clone();
        result.__dir__ *= -1;
      }
      return result;
    }

    /**
     * Extracts the unwrapped value from its lazy wrapper.
     *
     * @private
     * @name value
     * @memberOf LazyWrapper
     * @returns {*} Returns the unwrapped value.
     */
    function lazyValue() {
      var array = this.__wrapped__.value();
      if (!isArray(array)) {
        return baseWrapperValue(array, this.__actions__);
      }
      var dir = this.__dir__,
          isRight = dir < 0,
          view = getView(0, array.length, this.__views__),
          start = view.start,
          end = view.end,
          length = end - start,
          index = isRight ? end : (start - 1),
          takeCount = nativeMin(length, this.__takeCount__),
          iteratees = this.__iteratees__,
          iterLength = iteratees ? iteratees.length : 0,
          resIndex = 0,
          result = [];

      outer:
      while (length-- && resIndex < takeCount) {
        index += dir;

        var iterIndex = -1,
            value = array[index];

        while (++iterIndex < iterLength) {
          var data = iteratees[iterIndex],
              iteratee = data.iteratee,
              type = data.type;

          if (type == LAZY_DROP_WHILE_FLAG) {
            if (data.done && (isRight ? (index > data.index) : (index < data.index))) {
              data.count = 0;
              data.done = false;
            }
            data.index = index;
            if (!data.done) {
              var limit = data.limit;
              if (!(data.done = limit > -1 ? (data.count++ >= limit) : !iteratee(value))) {
                continue outer;
              }
            }
          } else {
            var computed = iteratee(value);
            if (type == LAZY_MAP_FLAG) {
              value = computed;
            } else if (!computed) {
              if (type == LAZY_FILTER_FLAG) {
                continue outer;
              } else {
                break outer;
              }
            }
          }
        }
        result[resIndex++] = value;
      }
      return result;
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates a cache object to store key/value pairs.
     *
     * @private
     * @static
     * @name Cache
     * @memberOf _.memoize
     */
    function MapCache() {
      this.__data__ = {};
    }

    /**
     * Removes `key` and its value from the cache.
     *
     * @private
     * @name delete
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed successfully, else `false`.
     */
    function mapDelete(key) {
      return this.has(key) && delete this.__data__[key];
    }

    /**
     * Gets the cached value for `key`.
     *
     * @private
     * @name get
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the cached value.
     */
    function mapGet(key) {
      return key == '__proto__' ? undefined : this.__data__[key];
    }

    /**
     * Checks if a cached value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapHas(key) {
      return key != '__proto__' && hasOwnProperty.call(this.__data__, key);
    }

    /**
     * Sets `value` to `key` of the cache.
     *
     * @private
     * @name set
     * @memberOf _.memoize.Cache
     * @param {string} key The key of the value to cache.
     * @param {*} value The value to cache.
     * @returns {Object} Returns the cache object.
     */
    function mapSet(key, value) {
      if (key != '__proto__') {
        this.__data__[key] = value;
      }
      return this;
    }

    /*------------------------------------------------------------------------*/

    /**
     *
     * Creates a cache object to store unique values.
     *
     * @private
     * @param {Array} [values] The values to cache.
     */
    function SetCache(values) {
      var length = values ? values.length : 0;

      this.data = { 'hash': nativeCreate(null), 'set': new Set };
      while (length--) {
        this.push(values[length]);
      }
    }

    /**
     * Checks if `value` is in `cache` mimicking the return signature of
     * `_.indexOf` by returning `0` if the value is found, else `-1`.
     *
     * @private
     * @param {Object} cache The cache to search.
     * @param {*} value The value to search for.
     * @returns {number} Returns `0` if `value` is found, else `-1`.
     */
    function cacheIndexOf(cache, value) {
      var data = cache.data,
          result = (typeof value == 'string' || isObject(value)) ? data.set.has(value) : data.hash[value];

      return result ? 0 : -1;
    }

    /**
     * Adds `value` to the cache.
     *
     * @private
     * @name push
     * @memberOf SetCache
     * @param {*} value The value to cache.
     */
    function cachePush(value) {
      var data = this.data;
      if (typeof value == 'string' || isObject(value)) {
        data.set.add(value);
      } else {
        data.hash[value] = true;
      }
    }

    /*------------------------------------------------------------------------*/

    /**
     * Copies the values of `source` to `array`.
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function arrayCopy(source, array) {
      var index = -1,
          length = source.length;

      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }

    /**
     * A specialized version of `_.forEach` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns `array`.
     */
    function arrayEach(array, iteratee) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
          break;
        }
      }
      return array;
    }

    /**
     * A specialized version of `_.forEachRight` for arrays without support for
     * callback shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns `array`.
     */
    function arrayEachRight(array, iteratee) {
      var length = array.length;

      while (length--) {
        if (iteratee(array[length], length, array) === false) {
          break;
        }
      }
      return array;
    }

    /**
     * A specialized version of `_.every` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`.
     */
    function arrayEvery(array, predicate) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (!predicate(array[index], index, array)) {
          return false;
        }
      }
      return true;
    }

    /**
     * A specialized version of `_.filter` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     */
    function arrayFilter(array, predicate) {
      var index = -1,
          length = array.length,
          resIndex = -1,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result[++resIndex] = value;
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.map` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function arrayMap(array, iteratee) {
      var index = -1,
          length = array.length,
          result = Array(length);

      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }

    /**
     * A specialized version of `_.max` for arrays without support for iteratees.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @returns {*} Returns the maximum value.
     */
    function arrayMax(array) {
      var index = -1,
          length = array.length,
          result = NEGATIVE_INFINITY;

      while (++index < length) {
        var value = array[index];
        if (value > result) {
          result = value;
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.min` for arrays without support for iteratees.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @returns {*} Returns the minimum value.
     */
    function arrayMin(array) {
      var index = -1,
          length = array.length,
          result = POSITIVE_INFINITY;

      while (++index < length) {
        var value = array[index];
        if (value < result) {
          result = value;
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.reduce` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {boolean} [initFromArray] Specify using the first element of `array`
     *  as the initial value.
     * @returns {*} Returns the accumulated value.
     */
    function arrayReduce(array, iteratee, accumulator, initFromArray) {
      var index = -1,
          length = array.length;

      if (initFromArray && length) {
        accumulator = array[++index];
      }
      while (++index < length) {
        accumulator = iteratee(accumulator, array[index], index, array);
      }
      return accumulator;
    }

    /**
     * A specialized version of `_.reduceRight` for arrays without support for
     * callback shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {boolean} [initFromArray] Specify using the last element of `array`
     *  as the initial value.
     * @returns {*} Returns the accumulated value.
     */
    function arrayReduceRight(array, iteratee, accumulator, initFromArray) {
      var length = array.length;
      if (initFromArray && length) {
        accumulator = array[--length];
      }
      while (length--) {
        accumulator = iteratee(accumulator, array[length], length, array);
      }
      return accumulator;
    }

    /**
     * A specialized version of `_.some` for arrays without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function arraySome(array, predicate) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        if (predicate(array[index], index, array)) {
          return true;
        }
      }
      return false;
    }

    /**
     * A specialized version of `_.sum` for arrays without support for iteratees.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @returns {number} Returns the sum.
     */
    function arraySum(array) {
      var length = array.length,
          result = 0;

      while (length--) {
        result += +array[length] || 0;
      }
      return result;
    }

    /**
     * Used by `_.defaults` to customize its `_.assign` use.
     *
     * @private
     * @param {*} objectValue The destination object property value.
     * @param {*} sourceValue The source object property value.
     * @returns {*} Returns the value to assign to the destination object.
     */
    function assignDefaults(objectValue, sourceValue) {
      return objectValue === undefined ? sourceValue : objectValue;
    }

    /**
     * Used by `_.template` to customize its `_.assign` use.
     *
     * **Note:** This function is like `assignDefaults` except that it ignores
     * inherited property values when checking if a property is `undefined`.
     *
     * @private
     * @param {*} objectValue The destination object property value.
     * @param {*} sourceValue The source object property value.
     * @param {string} key The key associated with the object and source values.
     * @param {Object} object The destination object.
     * @returns {*} Returns the value to assign to the destination object.
     */
    function assignOwnDefaults(objectValue, sourceValue, key, object) {
      return (objectValue === undefined || !hasOwnProperty.call(object, key))
        ? sourceValue
        : objectValue;
    }

    /**
     * A specialized version of `_.assign` for customizing assigned values without
     * support for argument juggling, multiple sources, and `this` binding `customizer`
     * functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} customizer The function to customize assigned values.
     * @returns {Object} Returns `object`.
     */
    function assignWith(object, source, customizer) {
      var props = keys(source);
      push.apply(props, getSymbols(source));

      var index = -1,
          length = props.length;

      while (++index < length) {
        var key = props[index],
            value = object[key],
            result = customizer(value, source[key], key, object, source);

        if ((result === result ? (result !== value) : (value === value)) ||
            (value === undefined && !(key in object))) {
          object[key] = result;
        }
      }
      return object;
    }

    /**
     * The base implementation of `_.assign` without support for argument juggling,
     * multiple sources, and `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    var baseAssign = nativeAssign || function(object, source) {
      return source == null
        ? object
        : baseCopy(source, getSymbols(source), baseCopy(source, keys(source), object));
    };

    /**
     * The base implementation of `_.at` without support for string collections
     * and individual key arguments.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {number[]|string[]} props The property names or indexes of elements to pick.
     * @returns {Array} Returns the new array of picked elements.
     */
    function baseAt(collection, props) {
      var index = -1,
          length = collection.length,
          isArr = isLength(length),
          propsLength = props.length,
          result = Array(propsLength);

      while(++index < propsLength) {
        var key = props[index];
        if (isArr) {
          result[index] = isIndex(key, length) ? collection[key] : undefined;
        } else {
          result[index] = collection[key];
        }
      }
      return result;
    }

    /**
     * Copies properties of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy properties from.
     * @param {Array} props The property names to copy.
     * @param {Object} [object={}] The object to copy properties to.
     * @returns {Object} Returns `object`.
     */
    function baseCopy(source, props, object) {
      object || (object = {});

      var index = -1,
          length = props.length;

      while (++index < length) {
        var key = props[index];
        object[key] = source[key];
      }
      return object;
    }

    /**
     * The base implementation of `_.callback` which supports specifying the
     * number of arguments to provide to `func`.
     *
     * @private
     * @param {*} [func=_.identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [argCount] The number of arguments to provide to `func`.
     * @returns {Function} Returns the callback.
     */
    function baseCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (type == 'function') {
        return thisArg === undefined
          ? func
          : bindCallback(func, thisArg, argCount);
      }
      if (func == null) {
        return identity;
      }
      if (type == 'object') {
        return baseMatches(func);
      }
      return thisArg === undefined
        ? property(func)
        : baseMatchesProperty(func, thisArg);
    }

    /**
     * The base implementation of `_.clone` without support for argument juggling
     * and `this` binding `customizer` functions.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @param {Function} [customizer] The function to customize cloning values.
     * @param {string} [key] The key of `value`.
     * @param {Object} [object] The object `value` belongs to.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
      var result;
      if (customizer) {
        result = object ? customizer(value, key, object) : customizer(value);
      }
      if (result !== undefined) {
        return result;
      }
      if (!isObject(value)) {
        return value;
      }
      var isArr = isArray(value);
      if (isArr) {
        result = initCloneArray(value);
        if (!isDeep) {
          return arrayCopy(value, result);
        }
      } else {
        var tag = objToString.call(value),
            isFunc = tag == funcTag;

        if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
          result = initCloneObject(isFunc ? {} : value);
          if (!isDeep) {
            return baseAssign(result, value);
          }
        } else {
          return cloneableTags[tag]
            ? initCloneByTag(value, tag, isDeep)
            : (object ? value : {});
        }
      }
      // Check for circular references and return corresponding clone.
      stackA || (stackA = []);
      stackB || (stackB = []);

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == value) {
          return stackB[length];
        }
      }
      // Add the source value to the stack of traversed objects and associate it with its clone.
      stackA.push(value);
      stackB.push(result);

      // Recursively populate clone (susceptible to call stack limits).
      (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {
        result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
      });
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    var baseCreate = (function() {
      function Object() {}
      return function(prototype) {
        if (isObject(prototype)) {
          Object.prototype = prototype;
          var result = new Object;
          Object.prototype = null;
        }
        return result || context.Object();
      };
    }());

    /**
     * The base implementation of `_.delay` and `_.defer` which accepts an index
     * of where to slice the arguments to provide to `func`.
     *
     * @private
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay invocation.
     * @param {Object} args The arguments provide to `func`.
     * @returns {number} Returns the timer id.
     */
    function baseDelay(func, wait, args) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * The base implementation of `_.difference` which accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Array} values The values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     */
    function baseDifference(array, values) {
      var length = array ? array.length : 0,
          result = [];

      if (!length) {
        return result;
      }
      var index = -1,
          indexOf = getIndexOf(),
          isCommon = indexOf == baseIndexOf,
          cache = (isCommon && values.length >= 200) ? createCache(values) : null,
          valuesLength = values.length;

      if (cache) {
        indexOf = cacheIndexOf;
        isCommon = false;
        values = cache;
      }
      outer:
      while (++index < length) {
        var value = array[index];

        if (isCommon && value === value) {
          var valuesIndex = valuesLength;
          while (valuesIndex--) {
            if (values[valuesIndex] === value) {
              continue outer;
            }
          }
          result.push(value);
        }
        else if (indexOf(values, value, 0) < 0) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.forEach` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array|Object|string} Returns `collection`.
     */
    var baseEach = createBaseEach(baseForOwn);

    /**
     * The base implementation of `_.forEachRight` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array|Object|string} Returns `collection`.
     */
    var baseEachRight = createBaseEach(baseForOwnRight, true);

    /**
     * The base implementation of `_.every` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`
     */
    function baseEvery(collection, predicate) {
      var result = true;
      baseEach(collection, function(value, index, collection) {
        result = !!predicate(value, index, collection);
        return result;
      });
      return result;
    }

    /**
     * The base implementation of `_.fill` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to fill.
     * @param {*} value The value to fill `array` with.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns `array`.
     */
    function baseFill(array, value, start, end) {
      var length = array.length;

      start = start == null ? 0 : (+start || 0);
      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = (end === undefined || end > length) ? length : (+end || 0);
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : (end >>> 0);
      start >>>= 0;

      while (start < length) {
        array[start++] = value;
      }
      return array;
    }

    /**
     * The base implementation of `_.filter` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     */
    function baseFilter(collection, predicate) {
      var result = [];
      baseEach(collection, function(value, index, collection) {
        if (predicate(value, index, collection)) {
          result.push(value);
        }
      });
      return result;
    }

    /**
     * The base implementation of `_.find`, `_.findLast`, `_.findKey`, and `_.findLastKey`,
     * without support for callback shorthands and `this` binding, which iterates
     * over `collection` using the provided `eachFunc`.
     *
     * @private
     * @param {Array|Object|string} collection The collection to search.
     * @param {Function} predicate The function invoked per iteration.
     * @param {Function} eachFunc The function to iterate over `collection`.
     * @param {boolean} [retKey] Specify returning the key of the found element
     *  instead of the element itself.
     * @returns {*} Returns the found element or its key, else `undefined`.
     */
    function baseFind(collection, predicate, eachFunc, retKey) {
      var result;
      eachFunc(collection, function(value, key, collection) {
        if (predicate(value, key, collection)) {
          result = retKey ? key : value;
          return false;
        }
      });
      return result;
    }

    /**
     * The base implementation of `_.flatten` with added support for restricting
     * flattening and specifying the start index.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} isDeep Specify a deep flatten.
     * @param {boolean} isStrict Restrict flattening to arrays and `arguments` objects.
     * @returns {Array} Returns the new flattened array.
     */
    function baseFlatten(array, isDeep, isStrict) {
      var index = -1,
          length = array.length,
          resIndex = -1,
          result = [];

      while (++index < length) {
        var value = array[index];

        if (isObjectLike(value) && isLength(value.length) && (isArray(value) || isArguments(value))) {
          if (isDeep) {
            // Recursively flatten arrays (susceptible to call stack limits).
            value = baseFlatten(value, isDeep, isStrict);
          }
          var valIndex = -1,
              valLength = value.length;

          result.length += valLength;
          while (++valIndex < valLength) {
            result[++resIndex] = value[valIndex];
          }
        } else if (!isStrict) {
          result[++resIndex] = value;
        }
      }
      return result;
    }

    /**
     * The base implementation of `baseForIn` and `baseForOwn` which iterates
     * over `object` properties returned by `keysFunc` invoking `iteratee` for
     * each property. Iteratee functions may exit iteration early by explicitly
     * returning `false`.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseFor = createBaseFor();

    /**
     * This function is like `baseFor` except that it iterates over properties
     * in the opposite order.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseForRight = createBaseFor(true);

    /**
     * The base implementation of `_.forIn` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForIn(object, iteratee) {
      return baseFor(object, iteratee, keysIn);
    }

    /**
     * The base implementation of `_.forOwn` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwn(object, iteratee) {
      return baseFor(object, iteratee, keys);
    }

    /**
     * The base implementation of `_.forOwnRight` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwnRight(object, iteratee) {
      return baseForRight(object, iteratee, keys);
    }

    /**
     * The base implementation of `_.functions` which creates an array of
     * `object` function property names filtered from those provided.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Array} props The property names to filter.
     * @returns {Array} Returns the new array of filtered property names.
     */
    function baseFunctions(object, props) {
      var index = -1,
          length = props.length,
          resIndex = -1,
          result = [];

      while (++index < length) {
        var key = props[index];
        if (isFunction(object[key])) {
          result[++resIndex] = key;
        }
      }
      return result;
    }

    /**
     * The base implementation of `get` without support for string paths
     * and default values.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} path The path of the property to get.
     * @param {string} [pathKey] The key representation of path.
     * @returns {*} Returns the resolved value.
     */
    function baseGet(object, path, pathKey) {
      if (object == null) {
        return;
      }
      if (pathKey !== undefined && pathKey in toObject(object)) {
        path = [pathKey];
      }
      var index = -1,
          length = path.length;

      while (object != null && ++index < length) {
        var result = object = object[path[index]];
      }
      return result;
    }

    /**
     * The base implementation of `_.isEqual` without support for `this` binding
     * `customizer` functions.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {Function} [customizer] The function to customize comparing values.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(value, other, customizer, isLoose, stackA, stackB) {
      // Exit early for identical values.
      if (value === other) {
        // Treat `+0` vs. `-0` as not equal.
        return value !== 0 || (1 / value == 1 / other);
      }
      var valType = typeof value,
          othType = typeof other;

      // Exit early for unlike primitive values.
      if ((valType != 'function' && valType != 'object' && othType != 'function' && othType != 'object') ||
          value == null || other == null) {
        // Return `false` unless both values are `NaN`.
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, baseIsEqual, customizer, isLoose, stackA, stackB);
    }

    /**
     * A specialized version of `baseIsEqual` for arrays and objects which performs
     * deep comparisons and tracks traversed objects enabling objects with circular
     * references to be compared.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing objects.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `value` objects.
     * @param {Array} [stackB=[]] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseIsEqualDeep(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var objIsArr = isArray(object),
          othIsArr = isArray(other),
          objTag = arrayTag,
          othTag = arrayTag;

      if (!objIsArr) {
        objTag = objToString.call(object);
        if (objTag == argsTag) {
          objTag = objectTag;
        } else if (objTag != objectTag) {
          objIsArr = isTypedArray(object);
        }
      }
      if (!othIsArr) {
        othTag = objToString.call(other);
        if (othTag == argsTag) {
          othTag = objectTag;
        } else if (othTag != objectTag) {
          othIsArr = isTypedArray(other);
        }
      }
      var objIsObj = objTag == objectTag,
          othIsObj = othTag == objectTag,
          isSameTag = objTag == othTag;

      if (isSameTag && !(objIsArr || objIsObj)) {
        return equalByTag(object, other, objTag);
      }
      if (!isLoose) {
        var valWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
            othWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

        if (valWrapped || othWrapped) {
          return equalFunc(valWrapped ? object.value() : object, othWrapped ? other.value() : other, customizer, isLoose, stackA, stackB);
        }
      }
      if (!isSameTag) {
        return false;
      }
      // Assume cyclic values are equal.
      // For more information on detecting circular references see https://es5.github.io/#JO.
      stackA || (stackA = []);
      stackB || (stackB = []);

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == object) {
          return stackB[length] == other;
        }
      }
      // Add `object` and `other` to the stack of traversed objects.
      stackA.push(object);
      stackB.push(other);

      var result = (objIsArr ? equalArrays : equalObjects)(object, other, equalFunc, customizer, isLoose, stackA, stackB);

      stackA.pop();
      stackB.pop();

      return result;
    }

    /**
     * The base implementation of `_.isMatch` without support for callback
     * shorthands and `this` binding.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Array} props The source property names to match.
     * @param {Array} values The source values to match.
     * @param {Array} strictCompareFlags Strict comparison flags for source values.
     * @param {Function} [customizer] The function to customize comparing objects.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     */
    function baseIsMatch(object, props, values, strictCompareFlags, customizer) {
      var index = -1,
          length = props.length,
          noCustomizer = !customizer;

      while (++index < length) {
        if ((noCustomizer && strictCompareFlags[index])
              ? values[index] !== object[props[index]]
              : !(props[index] in object)
            ) {
          return false;
        }
      }
      index = -1;
      while (++index < length) {
        var key = props[index],
            objValue = object[key],
            srcValue = values[index];

        if (noCustomizer && strictCompareFlags[index]) {
          var result = objValue !== undefined || (key in object);
        } else {
          result = customizer ? customizer(objValue, srcValue, key) : undefined;
          if (result === undefined) {
            result = baseIsEqual(srcValue, objValue, customizer, true);
          }
        }
        if (!result) {
          return false;
        }
      }
      return true;
    }

    /**
     * The base implementation of `_.map` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function baseMap(collection, iteratee) {
      var index = -1,
          length = getLength(collection),
          result = isLength(length) ? Array(length) : [];

      baseEach(collection, function(value, key, collection) {
        result[++index] = iteratee(value, key, collection);
      });
      return result;
    }

    /**
     * The base implementation of `_.matches` which does not clone `source`.
     *
     * @private
     * @param {Object} source The object of property values to match.
     * @returns {Function} Returns the new function.
     */
    function baseMatches(source) {
      var props = keys(source),
          length = props.length;

      if (!length) {
        return constant(true);
      }
      if (length == 1) {
        var key = props[0],
            value = source[key];

        if (isStrictComparable(value)) {
          return function(object) {
            if (object == null) {
              return false;
            }
            return object[key] === value && (value !== undefined || (key in toObject(object)));
          };
        }
      }
      var values = Array(length),
          strictCompareFlags = Array(length);

      while (length--) {
        value = source[props[length]];
        values[length] = value;
        strictCompareFlags[length] = isStrictComparable(value);
      }
      return function(object) {
        return object != null && baseIsMatch(toObject(object), props, values, strictCompareFlags);
      };
    }

    /**
     * The base implementation of `_.matchesProperty` which does not which does
     * not clone `value`.
     *
     * @private
     * @param {string} path The path of the property to get.
     * @param {*} value The value to compare.
     * @returns {Function} Returns the new function.
     */
    function baseMatchesProperty(path, value) {
      var isArr = isArray(path),
          isCommon = isKey(path) && isStrictComparable(value),
          pathKey = (path + '');

      path = toPath(path);
      return function(object) {
        if (object == null) {
          return false;
        }
        var key = pathKey;
        object = toObject(object);
        if ((isArr || !isCommon) && !(key in object)) {
          object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
          if (object == null) {
            return false;
          }
          key = last(path);
          object = toObject(object);
        }
        return object[key] === value
          ? (value !== undefined || (key in object))
          : baseIsEqual(value, object[key], null, true);
      };
    }

    /**
     * The base implementation of `_.merge` without support for argument juggling,
     * multiple sources, and `this` binding `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [customizer] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     * @returns {Object} Returns `object`.
     */
    function baseMerge(object, source, customizer, stackA, stackB) {
      if (!isObject(object)) {
        return object;
      }
      var isSrcArr = isLength(source.length) && (isArray(source) || isTypedArray(source));
      if (!isSrcArr) {
        var props = keys(source);
        push.apply(props, getSymbols(source));
      }
      arrayEach(props || source, function(srcValue, key) {
        if (props) {
          key = srcValue;
          srcValue = source[key];
        }
        if (isObjectLike(srcValue)) {
          stackA || (stackA = []);
          stackB || (stackB = []);
          baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
        }
        else {
          var value = object[key],
              result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
              isCommon = result === undefined;

          if (isCommon) {
            result = srcValue;
          }
          if ((isSrcArr || result !== undefined) &&
              (isCommon || (result === result ? (result !== value) : (value === value)))) {
            object[key] = result;
          }
        }
      });
      return object;
    }

    /**
     * A specialized version of `baseMerge` for arrays and objects which performs
     * deep merges and tracks traversed objects enabling objects with circular
     * references to be merged.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {string} key The key of the value to merge.
     * @param {Function} mergeFunc The function to merge values.
     * @param {Function} [customizer] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseMergeDeep(object, source, key, mergeFunc, customizer, stackA, stackB) {
      var length = stackA.length,
          srcValue = source[key];

      while (length--) {
        if (stackA[length] == srcValue) {
          object[key] = stackB[length];
          return;
        }
      }
      var value = object[key],
          result = customizer ? customizer(value, srcValue, key, object, source) : undefined,
          isCommon = result === undefined;

      if (isCommon) {
        result = srcValue;
        if (isLength(srcValue.length) && (isArray(srcValue) || isTypedArray(srcValue))) {
          result = isArray(value)
            ? value
            : (getLength(value) ? arrayCopy(value) : []);
        }
        else if (isPlainObject(srcValue) || isArguments(srcValue)) {
          result = isArguments(value)
            ? toPlainObject(value)
            : (isPlainObject(value) ? value : {});
        }
        else {
          isCommon = false;
        }
      }
      // Add the source value to the stack of traversed objects and associate
      // it with its merged value.
      stackA.push(srcValue);
      stackB.push(result);

      if (isCommon) {
        // Recursively merge objects and arrays (susceptible to call stack limits).
        object[key] = mergeFunc(result, srcValue, customizer, stackA, stackB);
      } else if (result === result ? (result !== value) : (value === value)) {
        object[key] = result;
      }
    }

    /**
     * The base implementation of `_.property` without support for deep paths.
     *
     * @private
     * @param {string} key The key of the property to get.
     * @returns {Function} Returns the new function.
     */
    function baseProperty(key) {
      return function(object) {
        return object == null ? undefined : object[key];
      };
    }

    /**
     * A specialized version of `baseProperty` which supports deep paths.
     *
     * @private
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new function.
     */
    function basePropertyDeep(path) {
      var pathKey = (path + '');
      path = toPath(path);
      return function(object) {
        return baseGet(object, path, pathKey);
      };
    }

    /**
     * The base implementation of `_.pullAt` without support for individual
     * index arguments and capturing the removed elements.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {number[]} indexes The indexes of elements to remove.
     * @returns {Array} Returns `array`.
     */
    function basePullAt(array, indexes) {
      var length = indexes.length;
      while (length--) {
        var index = parseFloat(indexes[length]);
        if (index != previous && isIndex(index)) {
          var previous = index;
          splice.call(array, index, 1);
        }
      }
      return array;
    }

    /**
     * The base implementation of `_.random` without support for argument juggling
     * and returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns the random number.
     */
    function baseRandom(min, max) {
      return min + floor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.reduce` and `_.reduceRight` without support
     * for callback shorthands and `this` binding, which iterates over `collection`
     * using the provided `eachFunc`.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {*} accumulator The initial value.
     * @param {boolean} initFromCollection Specify using the first or last element
     *  of `collection` as the initial value.
     * @param {Function} eachFunc The function to iterate over `collection`.
     * @returns {*} Returns the accumulated value.
     */
    function baseReduce(collection, iteratee, accumulator, initFromCollection, eachFunc) {
      eachFunc(collection, function(value, index, collection) {
        accumulator = initFromCollection
          ? (initFromCollection = false, value)
          : iteratee(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The base implementation of `setData` without support for hot loop detection.
     *
     * @private
     * @param {Function} func The function to associate metadata with.
     * @param {*} data The metadata.
     * @returns {Function} Returns `func`.
     */
    var baseSetData = !metaMap ? identity : function(func, data) {
      metaMap.set(func, data);
      return func;
    };

    /**
     * The base implementation of `_.slice` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseSlice(array, start, end) {
      var index = -1,
          length = array.length;

      start = start == null ? 0 : (+start || 0);
      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = (end === undefined || end > length) ? length : (+end || 0);
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : ((end - start) >>> 0);
      start >>>= 0;

      var result = Array(length);
      while (++index < length) {
        result[index] = array[index + start];
      }
      return result;
    }

    /**
     * The base implementation of `_.some` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function baseSome(collection, predicate) {
      var result;

      baseEach(collection, function(value, index, collection) {
        result = predicate(value, index, collection);
        return !result;
      });
      return !!result;
    }

    /**
     * The base implementation of `_.sortBy` which uses `comparer` to define
     * the sort order of `array` and replaces criteria objects with their
     * corresponding values.
     *
     * @private
     * @param {Array} array The array to sort.
     * @param {Function} comparer The function to define sort order.
     * @returns {Array} Returns `array`.
     */
    function baseSortBy(array, comparer) {
      var length = array.length;

      array.sort(comparer);
      while (length--) {
        array[length] = array[length].value;
      }
      return array;
    }

    /**
     * The base implementation of `_.sortByOrder` without param guards.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
     * @param {boolean[]} orders The sort orders of `iteratees`.
     * @returns {Array} Returns the new sorted array.
     */
    function baseSortByOrder(collection, iteratees, orders) {
      var callback = getCallback(),
          index = -1;

      iteratees = arrayMap(iteratees, function(iteratee) { return callback(iteratee); });

      var result = baseMap(collection, function(value) {
        var criteria = arrayMap(iteratees, function(iteratee) { return iteratee(value); });
        return { 'criteria': criteria, 'index': ++index, 'value': value };
      });

      return baseSortBy(result, function(object, other) {
        return compareMultiple(object, other, orders);
      });
    }

    /**
     * The base implementation of `_.sum` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {number} Returns the sum.
     */
    function baseSum(collection, iteratee) {
      var result = 0;
      baseEach(collection, function(value, index, collection) {
        result += +iteratee(value, index, collection) || 0;
      });
      return result;
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * and `this` binding.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Function} [iteratee] The function invoked per iteration.
     * @returns {Array} Returns the new duplicate-value-free array.
     */
    function baseUniq(array, iteratee) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array.length,
          isCommon = indexOf == baseIndexOf,
          isLarge = isCommon && length >= 200,
          seen = isLarge ? createCache() : null,
          result = [];

      if (seen) {
        indexOf = cacheIndexOf;
        isCommon = false;
      } else {
        isLarge = false;
        seen = iteratee ? [] : result;
      }
      outer:
      while (++index < length) {
        var value = array[index],
            computed = iteratee ? iteratee(value, index, array) : value;

        if (isCommon && value === value) {
          var seenIndex = seen.length;
          while (seenIndex--) {
            if (seen[seenIndex] === computed) {
              continue outer;
            }
          }
          if (iteratee) {
            seen.push(computed);
          }
          result.push(value);
        }
        else if (indexOf(seen, computed, 0) < 0) {
          if (iteratee || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.values` and `_.valuesIn` which creates an
     * array of `object` property values corresponding to the property names
     * of `props`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} props The property names to get values for.
     * @returns {Object} Returns the array of property values.
     */
    function baseValues(object, props) {
      var index = -1,
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /**
     * The base implementation of `_.dropRightWhile`, `_.dropWhile`, `_.takeRightWhile`,
     * and `_.takeWhile` without support for callback shorthands and `this` binding.
     *
     * @private
     * @param {Array} array The array to query.
     * @param {Function} predicate The function invoked per iteration.
     * @param {boolean} [isDrop] Specify dropping elements instead of taking them.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseWhile(array, predicate, isDrop, fromRight) {
      var length = array.length,
          index = fromRight ? length : -1;

      while ((fromRight ? index-- : ++index < length) && predicate(array[index], index, array)) {}
      return isDrop
        ? baseSlice(array, (fromRight ? 0 : index), (fromRight ? index + 1 : length))
        : baseSlice(array, (fromRight ? index + 1 : 0), (fromRight ? length : index));
    }

    /**
     * The base implementation of `wrapperValue` which returns the result of
     * performing a sequence of actions on the unwrapped `value`, where each
     * successive action is supplied the return value of the previous.
     *
     * @private
     * @param {*} value The unwrapped value.
     * @param {Array} actions Actions to peform to resolve the unwrapped value.
     * @returns {*} Returns the resolved value.
     */
    function baseWrapperValue(value, actions) {
      var result = value;
      if (result instanceof LazyWrapper) {
        result = result.value();
      }
      var index = -1,
          length = actions.length;

      while (++index < length) {
        var args = [result],
            action = actions[index];

        push.apply(args, action.args);
        result = action.func.apply(action.thisArg, args);
      }
      return result;
    }

    /**
     * Performs a binary search of `array` to determine the index at which `value`
     * should be inserted into `array` in order to maintain its sort order.
     *
     * @private
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     */
    function binaryIndex(array, value, retHighest) {
      var low = 0,
          high = array ? array.length : low;

      if (typeof value == 'number' && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
        while (low < high) {
          var mid = (low + high) >>> 1,
              computed = array[mid];

          if (retHighest ? (computed <= value) : (computed < value)) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        return high;
      }
      return binaryIndexBy(array, value, identity, retHighest);
    }

    /**
     * This function is like `binaryIndex` except that it invokes `iteratee` for
     * `value` and each element of `array` to compute their sort ranking. The
     * iteratee is invoked with one argument; (value).
     *
     * @private
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     */
    function binaryIndexBy(array, value, iteratee, retHighest) {
      value = iteratee(value);

      var low = 0,
          high = array ? array.length : 0,
          valIsNaN = value !== value,
          valIsUndef = value === undefined;

      while (low < high) {
        var mid = floor((low + high) / 2),
            computed = iteratee(array[mid]),
            isReflexive = computed === computed;

        if (valIsNaN) {
          var setLow = isReflexive || retHighest;
        } else if (valIsUndef) {
          setLow = isReflexive && (retHighest || computed !== undefined);
        } else {
          setLow = retHighest ? (computed <= value) : (computed < value);
        }
        if (setLow) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      return nativeMin(high, MAX_ARRAY_INDEX);
    }

    /**
     * A specialized version of `baseCallback` which only supports `this` binding
     * and specifying the number of arguments to provide to `func`.
     *
     * @private
     * @param {Function} func The function to bind.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {number} [argCount] The number of arguments to provide to `func`.
     * @returns {Function} Returns the callback.
     */
    function bindCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      if (thisArg === undefined) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
        case 5: return function(value, other, key, object, source) {
          return func.call(thisArg, value, other, key, object, source);
        };
      }
      return function() {
        return func.apply(thisArg, arguments);
      };
    }

    /**
     * Creates a clone of the given array buffer.
     *
     * @private
     * @param {ArrayBuffer} buffer The array buffer to clone.
     * @returns {ArrayBuffer} Returns the cloned array buffer.
     */
    function bufferClone(buffer) {
      return bufferSlice.call(buffer, 0);
    }
    if (!bufferSlice) {
      // PhantomJS has `ArrayBuffer` and `Uint8Array` but not `Float64Array`.
      bufferClone = !(ArrayBuffer && Uint8Array) ? constant(null) : function(buffer) {
        var byteLength = buffer.byteLength,
            floatLength = Float64Array ? floor(byteLength / FLOAT64_BYTES_PER_ELEMENT) : 0,
            offset = floatLength * FLOAT64_BYTES_PER_ELEMENT,
            result = new ArrayBuffer(byteLength);

        if (floatLength) {
          var view = new Float64Array(result, 0, floatLength);
          view.set(new Float64Array(buffer, 0, floatLength));
        }
        if (byteLength != offset) {
          view = new Uint8Array(result, offset);
          view.set(new Uint8Array(buffer, offset));
        }
        return result;
      };
    }

    /**
     * Creates an array that is the composition of partially applied arguments,
     * placeholders, and provided arguments into a single array of arguments.
     *
     * @private
     * @param {Array|Object} args The provided arguments.
     * @param {Array} partials The arguments to prepend to those provided.
     * @param {Array} holders The `partials` placeholder indexes.
     * @returns {Array} Returns the new array of composed arguments.
     */
    function composeArgs(args, partials, holders) {
      var holdersLength = holders.length,
          argsIndex = -1,
          argsLength = nativeMax(args.length - holdersLength, 0),
          leftIndex = -1,
          leftLength = partials.length,
          result = Array(argsLength + leftLength);

      while (++leftIndex < leftLength) {
        result[leftIndex] = partials[leftIndex];
      }
      while (++argsIndex < holdersLength) {
        result[holders[argsIndex]] = args[argsIndex];
      }
      while (argsLength--) {
        result[leftIndex++] = args[argsIndex++];
      }
      return result;
    }

    /**
     * This function is like `composeArgs` except that the arguments composition
     * is tailored for `_.partialRight`.
     *
     * @private
     * @param {Array|Object} args The provided arguments.
     * @param {Array} partials The arguments to append to those provided.
     * @param {Array} holders The `partials` placeholder indexes.
     * @returns {Array} Returns the new array of composed arguments.
     */
    function composeArgsRight(args, partials, holders) {
      var holdersIndex = -1,
          holdersLength = holders.length,
          argsIndex = -1,
          argsLength = nativeMax(args.length - holdersLength, 0),
          rightIndex = -1,
          rightLength = partials.length,
          result = Array(argsLength + rightLength);

      while (++argsIndex < argsLength) {
        result[argsIndex] = args[argsIndex];
      }
      var pad = argsIndex;
      while (++rightIndex < rightLength) {
        result[pad + rightIndex] = partials[rightIndex];
      }
      while (++holdersIndex < holdersLength) {
        result[pad + holders[holdersIndex]] = args[argsIndex++];
      }
      return result;
    }

    /**
     * Creates a function that aggregates a collection, creating an accumulator
     * object composed from the results of running each element in the collection
     * through an iteratee.
     *
     * **Note:** This function is used to create `_.countBy`, `_.groupBy`, `_.indexBy`,
     * and `_.partition`.
     *
     * @private
     * @param {Function} setter The function to set keys and values of the accumulator object.
     * @param {Function} [initializer] The function to initialize the accumulator object.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter, initializer) {
      return function(collection, iteratee, thisArg) {
        var result = initializer ? initializer() : {};
        iteratee = getCallback(iteratee, thisArg, 3);

        if (isArray(collection)) {
          var index = -1,
              length = collection.length;

          while (++index < length) {
            var value = collection[index];
            setter(result, value, iteratee(value, index, collection), collection);
          }
        } else {
          baseEach(collection, function(value, key, collection) {
            setter(result, value, iteratee(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a function that assigns properties of source object(s) to a given
     * destination object.
     *
     * **Note:** This function is used to create `_.assign`, `_.defaults`, and `_.merge`.
     *
     * @private
     * @param {Function} assigner The function to assign values.
     * @returns {Function} Returns the new assigner function.
     */
    function createAssigner(assigner) {
      return restParam(function(object, sources) {
        var index = -1,
            length = object == null ? 0 : sources.length,
            customizer = length > 2 && sources[length - 2],
            guard = length > 2 && sources[2],
            thisArg = length > 1 && sources[length - 1];

        if (typeof customizer == 'function') {
          customizer = bindCallback(customizer, thisArg, 5);
          length -= 2;
        } else {
          customizer = typeof thisArg == 'function' ? thisArg : null;
          length -= (customizer ? 1 : 0);
        }
        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          customizer = length < 3 ? null : customizer;
          length = 1;
        }
        while (++index < length) {
          var source = sources[index];
          if (source) {
            assigner(object, source, customizer);
          }
        }
        return object;
      });
    }

    /**
     * Creates a `baseEach` or `baseEachRight` function.
     *
     * @private
     * @param {Function} eachFunc The function to iterate over a collection.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseEach(eachFunc, fromRight) {
      return function(collection, iteratee) {
        var length = collection ? getLength(collection) : 0;
        if (!isLength(length)) {
          return eachFunc(collection, iteratee);
        }
        var index = fromRight ? length : -1,
            iterable = toObject(collection);

        while ((fromRight ? index-- : ++index < length)) {
          if (iteratee(iterable[index], index, iterable) === false) {
            break;
          }
        }
        return collection;
      };
    }

    /**
     * Creates a base function for `_.forIn` or `_.forInRight`.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var iterable = toObject(object),
            props = keysFunc(object),
            length = props.length,
            index = fromRight ? length : -1;

        while ((fromRight ? index-- : ++index < length)) {
          var key = props[index];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }

    /**
     * Creates a function that wraps `func` and invokes it with the `this`
     * binding of `thisArg`.
     *
     * @private
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @returns {Function} Returns the new bound function.
     */
    function createBindWrapper(func, thisArg) {
      var Ctor = createCtorWrapper(func);

      function wrapper() {
        var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
        return fn.apply(thisArg, arguments);
      }
      return wrapper;
    }

    /**
     * Creates a `Set` cache object to optimize linear searches of large arrays.
     *
     * @private
     * @param {Array} [values] The values to cache.
     * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.
     */
    var createCache = !(nativeCreate && Set) ? constant(null) : function(values) {
      return new SetCache(values);
    };

    /**
     * Creates a function that produces compound words out of the words in a
     * given string.
     *
     * @private
     * @param {Function} callback The function to combine each word.
     * @returns {Function} Returns the new compounder function.
     */
    function createCompounder(callback) {
      return function(string) {
        var index = -1,
            array = words(deburr(string)),
            length = array.length,
            result = '';

        while (++index < length) {
          result = callback(result, array[index], index);
        }
        return result;
      };
    }

    /**
     * Creates a function that produces an instance of `Ctor` regardless of
     * whether it was invoked as part of a `new` expression or by `call` or `apply`.
     *
     * @private
     * @param {Function} Ctor The constructor to wrap.
     * @returns {Function} Returns the new wrapped function.
     */
    function createCtorWrapper(Ctor) {
      return function() {
        var thisBinding = baseCreate(Ctor.prototype),
            result = Ctor.apply(thisBinding, arguments);

        // Mimic the constructor's `return` behavior.
        // See https://es5.github.io/#x13.2.2 for more details.
        return isObject(result) ? result : thisBinding;
      };
    }

    /**
     * Creates a `_.curry` or `_.curryRight` function.
     *
     * @private
     * @param {boolean} flag The curry bit flag.
     * @returns {Function} Returns the new curry function.
     */
    function createCurry(flag) {
      function curryFunc(func, arity, guard) {
        if (guard && isIterateeCall(func, arity, guard)) {
          arity = null;
        }
        var result = createWrapper(func, flag, null, null, null, null, null, arity);
        result.placeholder = curryFunc.placeholder;
        return result;
      }
      return curryFunc;
    }

    /**
     * Creates a `_.max` or `_.min` function.
     *
     * @private
     * @param {Function} arrayFunc The function to get the extremum value from an array.
     * @param {boolean} [isMin] Specify returning the minimum, instead of the maximum,
     *  extremum value.
     * @returns {Function} Returns the new extremum function.
     */
    function createExtremum(arrayFunc, isMin) {
      return function(collection, iteratee, thisArg) {
        if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
          iteratee = null;
        }
        var func = getCallback(),
            noIteratee = iteratee == null;

        if (!(func === baseCallback && noIteratee)) {
          noIteratee = false;
          iteratee = func(iteratee, thisArg, 3);
        }
        if (noIteratee) {
          var isArr = isArray(collection);
          if (!isArr && isString(collection)) {
            iteratee = charAtCallback;
          } else {
            return arrayFunc(isArr ? collection : toIterable(collection));
          }
        }
        return extremumBy(collection, iteratee, isMin);
      };
    }

    /**
     * Creates a `_.find` or `_.findLast` function.
     *
     * @private
     * @param {Function} eachFunc The function to iterate over a collection.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new find function.
     */
    function createFind(eachFunc, fromRight) {
      return function(collection, predicate, thisArg) {
        predicate = getCallback(predicate, thisArg, 3);
        if (isArray(collection)) {
          var index = baseFindIndex(collection, predicate, fromRight);
          return index > -1 ? collection[index] : undefined;
        }
        return baseFind(collection, predicate, eachFunc);
      }
    }

    /**
     * Creates a `_.findIndex` or `_.findLastIndex` function.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new find function.
     */
    function createFindIndex(fromRight) {
      return function(array, predicate, thisArg) {
        if (!(array && array.length)) {
          return -1;
        }
        predicate = getCallback(predicate, thisArg, 3);
        return baseFindIndex(array, predicate, fromRight);
      };
    }

    /**
     * Creates a `_.findKey` or `_.findLastKey` function.
     *
     * @private
     * @param {Function} objectFunc The function to iterate over an object.
     * @returns {Function} Returns the new find function.
     */
    function createFindKey(objectFunc) {
      return function(object, predicate, thisArg) {
        predicate = getCallback(predicate, thisArg, 3);
        return baseFind(object, predicate, objectFunc, true);
      };
    }

    /**
     * Creates a `_.flow` or `_.flowRight` function.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new flow function.
     */
    function createFlow(fromRight) {
      return function() {
        var length = arguments.length;
        if (!length) {
          return function() { return arguments[0]; };
        }
        var wrapper,
            index = fromRight ? length : -1,
            leftIndex = 0,
            funcs = Array(length);

        while ((fromRight ? index-- : ++index < length)) {
          var func = funcs[leftIndex++] = arguments[index];
          if (typeof func != 'function') {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          var funcName = wrapper ? '' : getFuncName(func);
          wrapper = funcName == 'wrapper' ? new LodashWrapper([]) : wrapper;
        }
        index = wrapper ? -1 : length;
        while (++index < length) {
          func = funcs[index];
          funcName = getFuncName(func);

          var data = funcName == 'wrapper' ? getData(func) : null;
          if (data && isLaziable(data[0])) {
            wrapper = wrapper[getFuncName(data[0])].apply(wrapper, data[3]);
          } else {
            wrapper = (func.length == 1 && isLaziable(func)) ? wrapper[funcName]() : wrapper.thru(func);
          }
        }
        return function() {
          var args = arguments;
          if (wrapper && args.length == 1 && isArray(args[0])) {
            return wrapper.plant(args[0]).value();
          }
          var index = 0,
              result = funcs[index].apply(this, args);

          while (++index < length) {
            result = funcs[index].call(this, result);
          }
          return result;
        };
      };
    }

    /**
     * Creates a function for `_.forEach` or `_.forEachRight`.
     *
     * @private
     * @param {Function} arrayFunc The function to iterate over an array.
     * @param {Function} eachFunc The function to iterate over a collection.
     * @returns {Function} Returns the new each function.
     */
    function createForEach(arrayFunc, eachFunc) {
      return function(collection, iteratee, thisArg) {
        return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
          ? arrayFunc(collection, iteratee)
          : eachFunc(collection, bindCallback(iteratee, thisArg, 3));
      };
    }

    /**
     * Creates a function for `_.forIn` or `_.forInRight`.
     *
     * @private
     * @param {Function} objectFunc The function to iterate over an object.
     * @returns {Function} Returns the new each function.
     */
    function createForIn(objectFunc) {
      return function(object, iteratee, thisArg) {
        if (typeof iteratee != 'function' || thisArg !== undefined) {
          iteratee = bindCallback(iteratee, thisArg, 3);
        }
        return objectFunc(object, iteratee, keysIn);
      };
    }

    /**
     * Creates a function for `_.forOwn` or `_.forOwnRight`.
     *
     * @private
     * @param {Function} objectFunc The function to iterate over an object.
     * @returns {Function} Returns the new each function.
     */
    function createForOwn(objectFunc) {
      return function(object, iteratee, thisArg) {
        if (typeof iteratee != 'function' || thisArg !== undefined) {
          iteratee = bindCallback(iteratee, thisArg, 3);
        }
        return objectFunc(object, iteratee);
      };
    }

    /**
     * Creates a function for `_.padLeft` or `_.padRight`.
     *
     * @private
     * @param {boolean} [fromRight] Specify padding from the right.
     * @returns {Function} Returns the new pad function.
     */
    function createPadDir(fromRight) {
      return function(string, length, chars) {
        string = baseToString(string);
        return string && ((fromRight ? string : '') + createPadding(string, length, chars) + (fromRight ? '' : string));
      };
    }

    /**
     * Creates a `_.partial` or `_.partialRight` function.
     *
     * @private
     * @param {boolean} flag The partial bit flag.
     * @returns {Function} Returns the new partial function.
     */
    function createPartial(flag) {
      var partialFunc = restParam(function(func, partials) {
        var holders = replaceHolders(partials, partialFunc.placeholder);
        return createWrapper(func, flag, null, partials, holders);
      });
      return partialFunc;
    }

    /**
     * Creates a function for `_.reduce` or `_.reduceRight`.
     *
     * @private
     * @param {Function} arrayFunc The function to iterate over an array.
     * @param {Function} eachFunc The function to iterate over a collection.
     * @returns {Function} Returns the new each function.
     */
    function createReduce(arrayFunc, eachFunc) {
      return function(collection, iteratee, accumulator, thisArg) {
        var initFromArray = arguments.length < 3;
        return (typeof iteratee == 'function' && thisArg === undefined && isArray(collection))
          ? arrayFunc(collection, iteratee, accumulator, initFromArray)
          : baseReduce(collection, getCallback(iteratee, thisArg, 4), accumulator, initFromArray, eachFunc);
      };
    }

    /**
     * Creates a function that wraps `func` and invokes it with optional `this`
     * binding of, partial application, and currying.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of flags. See `createWrapper` for more details.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {Array} [partials] The arguments to prepend to those provided to the new function.
     * @param {Array} [holders] The `partials` placeholder indexes.
     * @param {Array} [partialsRight] The arguments to append to those provided to the new function.
     * @param {Array} [holdersRight] The `partialsRight` placeholder indexes.
     * @param {Array} [argPos] The argument positions of the new function.
     * @param {number} [ary] The arity cap of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createHybridWrapper(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity) {
      var isAry = bitmask & ARY_FLAG,
          isBind = bitmask & BIND_FLAG,
          isBindKey = bitmask & BIND_KEY_FLAG,
          isCurry = bitmask & CURRY_FLAG,
          isCurryBound = bitmask & CURRY_BOUND_FLAG,
          isCurryRight = bitmask & CURRY_RIGHT_FLAG;

      var Ctor = !isBindKey && createCtorWrapper(func),
          key = func;

      function wrapper() {
        // Avoid `arguments` object use disqualifying optimizations by
        // converting it to an array before providing it to other functions.
        var length = arguments.length,
            index = length,
            args = Array(length);

        while (index--) {
          args[index] = arguments[index];
        }
        if (partials) {
          args = composeArgs(args, partials, holders);
        }
        if (partialsRight) {
          args = composeArgsRight(args, partialsRight, holdersRight);
        }
        if (isCurry || isCurryRight) {
          var placeholder = wrapper.placeholder,
              argsHolders = replaceHolders(args, placeholder);

          length -= argsHolders.length;
          if (length < arity) {
            var newArgPos = argPos ? arrayCopy(argPos) : null,
                newArity = nativeMax(arity - length, 0),
                newsHolders = isCurry ? argsHolders : null,
                newHoldersRight = isCurry ? null : argsHolders,
                newPartials = isCurry ? args : null,
                newPartialsRight = isCurry ? null : args;

            bitmask |= (isCurry ? PARTIAL_FLAG : PARTIAL_RIGHT_FLAG);
            bitmask &= ~(isCurry ? PARTIAL_RIGHT_FLAG : PARTIAL_FLAG);

            if (!isCurryBound) {
              bitmask &= ~(BIND_FLAG | BIND_KEY_FLAG);
            }
            var newData = [func, bitmask, thisArg, newPartials, newsHolders, newPartialsRight, newHoldersRight, newArgPos, ary, newArity],
                result = createHybridWrapper.apply(undefined, newData);

            if (isLaziable(func)) {
              setData(result, newData);
            }
            result.placeholder = placeholder;
            return result;
          }
        }
        var thisBinding = isBind ? thisArg : this;
        if (isBindKey) {
          func = thisBinding[key];
        }
        if (argPos) {
          args = reorder(args, argPos);
        }
        if (isAry && ary < args.length) {
          args.length = ary;
        }
        var fn = (this && this !== root && this instanceof wrapper) ? (Ctor || createCtorWrapper(func)) : func;
        return fn.apply(thisBinding, args);
      }
      return wrapper;
    }

    /**
     * Creates the padding required for `string` based on the given `length`.
     * The `chars` string is truncated if the number of characters exceeds `length`.
     *
     * @private
     * @param {string} string The string to create padding for.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the pad for `string`.
     */
    function createPadding(string, length, chars) {
      var strLength = string.length;
      length = +length;

      if (strLength >= length || !nativeIsFinite(length)) {
        return '';
      }
      var padLength = length - strLength;
      chars = chars == null ? ' ' : (chars + '');
      return repeat(chars, ceil(padLength / chars.length)).slice(0, padLength);
    }

    /**
     * Creates a function that wraps `func` and invokes it with the optional `this`
     * binding of `thisArg` and the `partials` prepended to those provided to
     * the wrapper.
     *
     * @private
     * @param {Function} func The function to partially apply arguments to.
     * @param {number} bitmask The bitmask of flags. See `createWrapper` for more details.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {Array} partials The arguments to prepend to those provided to the new function.
     * @returns {Function} Returns the new bound function.
     */
    function createPartialWrapper(func, bitmask, thisArg, partials) {
      var isBind = bitmask & BIND_FLAG,
          Ctor = createCtorWrapper(func);

      function wrapper() {
        // Avoid `arguments` object use disqualifying optimizations by
        // converting it to an array before providing it `func`.
        var argsIndex = -1,
            argsLength = arguments.length,
            leftIndex = -1,
            leftLength = partials.length,
            args = Array(argsLength + leftLength);

        while (++leftIndex < leftLength) {
          args[leftIndex] = partials[leftIndex];
        }
        while (argsLength--) {
          args[leftIndex++] = arguments[++argsIndex];
        }
        var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
        return fn.apply(isBind ? thisArg : this, args);
      }
      return wrapper;
    }

    /**
     * Creates a `_.sortedIndex` or `_.sortedLastIndex` function.
     *
     * @private
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {Function} Returns the new index function.
     */
    function createSortedIndex(retHighest) {
      return function(array, value, iteratee, thisArg) {
        var func = getCallback(iteratee);
        return (func === baseCallback && iteratee == null)
          ? binaryIndex(array, value, retHighest)
          : binaryIndexBy(array, value, func(iteratee, thisArg, 1), retHighest);
      };
    }

    /**
     * Creates a function that either curries or invokes `func` with optional
     * `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of flags.
     *  The bitmask may be composed of the following flags:
     *     1 - `_.bind`
     *     2 - `_.bindKey`
     *     4 - `_.curry` or `_.curryRight` of a bound function
     *     8 - `_.curry`
     *    16 - `_.curryRight`
     *    32 - `_.partial`
     *    64 - `_.partialRight`
     *   128 - `_.rearg`
     *   256 - `_.ary`
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {Array} [partials] The arguments to be partially applied.
     * @param {Array} [holders] The `partials` placeholder indexes.
     * @param {Array} [argPos] The argument positions of the new function.
     * @param {number} [ary] The arity cap of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createWrapper(func, bitmask, thisArg, partials, holders, argPos, ary, arity) {
      var isBindKey = bitmask & BIND_KEY_FLAG;
      if (!isBindKey && typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var length = partials ? partials.length : 0;
      if (!length) {
        bitmask &= ~(PARTIAL_FLAG | PARTIAL_RIGHT_FLAG);
        partials = holders = null;
      }
      length -= (holders ? holders.length : 0);
      if (bitmask & PARTIAL_RIGHT_FLAG) {
        var partialsRight = partials,
            holdersRight = holders;

        partials = holders = null;
      }
      var data = isBindKey ? null : getData(func),
          newData = [func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity];

      if (data) {
        mergeData(newData, data);
        bitmask = newData[1];
        arity = newData[9];
      }
      newData[9] = arity == null
        ? (isBindKey ? 0 : func.length)
        : (nativeMax(arity - length, 0) || 0);

      if (bitmask == BIND_FLAG) {
        var result = createBindWrapper(newData[0], newData[2]);
      } else if ((bitmask == PARTIAL_FLAG || bitmask == (BIND_FLAG | PARTIAL_FLAG)) && !newData[4].length) {
        result = createPartialWrapper.apply(undefined, newData);
      } else {
        result = createHybridWrapper.apply(undefined, newData);
      }
      var setter = data ? baseSetData : setData;
      return setter(result, newData);
    }

    /**
     * A specialized version of `baseIsEqualDeep` for arrays with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Array} array The array to compare.
     * @param {Array} other The other array to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing arrays.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
     */
    function equalArrays(array, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var index = -1,
          arrLength = array.length,
          othLength = other.length,
          result = true;

      if (arrLength != othLength && !(isLoose && othLength > arrLength)) {
        return false;
      }
      // Deep compare the contents, ignoring non-numeric properties.
      while (result && ++index < arrLength) {
        var arrValue = array[index],
            othValue = other[index];

        result = undefined;
        if (customizer) {
          result = isLoose
            ? customizer(othValue, arrValue, index)
            : customizer(arrValue, othValue, index);
        }
        if (result === undefined) {
          // Recursively compare arrays (susceptible to call stack limits).
          if (isLoose) {
            var othIndex = othLength;
            while (othIndex--) {
              othValue = other[othIndex];
              result = (arrValue && arrValue === othValue) || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
              if (result) {
                break;
              }
            }
          } else {
            result = (arrValue && arrValue === othValue) || equalFunc(arrValue, othValue, customizer, isLoose, stackA, stackB);
          }
        }
      }
      return !!result;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for comparing objects of
     * the same `toStringTag`.
     *
     * **Note:** This function only supports comparing values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} value The object to compare.
     * @param {Object} other The other object to compare.
     * @param {string} tag The `toStringTag` of the objects to compare.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalByTag(object, other, tag) {
      switch (tag) {
        case boolTag:
        case dateTag:
          // Coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.
          return +object == +other;

        case errorTag:
          return object.name == other.name && object.message == other.message;

        case numberTag:
          // Treat `NaN` vs. `NaN` as equal.
          return (object != +object)
            ? other != +other
            // But, treat `-0` vs. `+0` as not equal.
            : (object == 0 ? ((1 / object) == (1 / other)) : object == +other);

        case regexpTag:
        case stringTag:
          // Coerce regexes to strings and treat strings primitives and string
          // objects as equal. See https://es5.github.io/#x15.10.6.4 for more details.
          return object == (other + '');
      }
      return false;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for objects with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Function} [customizer] The function to customize comparing values.
     * @param {boolean} [isLoose] Specify performing partial comparisons.
     * @param {Array} [stackA] Tracks traversed `value` objects.
     * @param {Array} [stackB] Tracks traversed `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalObjects(object, other, equalFunc, customizer, isLoose, stackA, stackB) {
      var objProps = keys(object),
          objLength = objProps.length,
          othProps = keys(other),
          othLength = othProps.length;

      if (objLength != othLength && !isLoose) {
        return false;
      }
      var skipCtor = isLoose,
          index = -1;

      while (++index < objLength) {
        var key = objProps[index],
            result = isLoose ? key in other : hasOwnProperty.call(other, key);

        if (result) {
          var objValue = object[key],
              othValue = other[key];

          result = undefined;
          if (customizer) {
            result = isLoose
              ? customizer(othValue, objValue, key)
              : customizer(objValue, othValue, key);
          }
          if (result === undefined) {
            // Recursively compare objects (susceptible to call stack limits).
            result = (objValue && objValue === othValue) || equalFunc(objValue, othValue, customizer, isLoose, stackA, stackB);
          }
        }
        if (!result) {
          return false;
        }
        skipCtor || (skipCtor = key == 'constructor');
      }
      if (!skipCtor) {
        var objCtor = object.constructor,
            othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (objCtor != othCtor &&
            ('constructor' in object && 'constructor' in other) &&
            !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
              typeof othCtor == 'function' && othCtor instanceof othCtor)) {
          return false;
        }
      }
      return true;
    }

    /**
     * Gets the extremum value of `collection` invoking `iteratee` for each value
     * in `collection` to generate the criterion by which the value is ranked.
     * The `iteratee` is invoked with three arguments: (value, index, collection).
     *
     * @private
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {boolean} [isMin] Specify returning the minimum, instead of the
     *  maximum, extremum value.
     * @returns {*} Returns the extremum value.
     */
    function extremumBy(collection, iteratee, isMin) {
      var exValue = isMin ? POSITIVE_INFINITY : NEGATIVE_INFINITY,
          computed = exValue,
          result = computed;

      baseEach(collection, function(value, index, collection) {
        var current = iteratee(value, index, collection);
        if ((isMin ? (current < computed) : (current > computed)) ||
            (current === exValue && current === result)) {
          computed = current;
          result = value;
        }
      });
      return result;
    }

    /**
     * Gets the appropriate "callback" function. If the `_.callback` method is
     * customized this function returns the custom method, otherwise it returns
     * the `baseCallback` function. If arguments are provided the chosen function
     * is invoked with them and its result is returned.
     *
     * @private
     * @returns {Function} Returns the chosen function or its result.
     */
    function getCallback(func, thisArg, argCount) {
      var result = lodash.callback || callback;
      result = result === callback ? baseCallback : result;
      return argCount ? result(func, thisArg, argCount) : result;
    }

    /**
     * Gets metadata for `func`.
     *
     * @private
     * @param {Function} func The function to query.
     * @returns {*} Returns the metadata for `func`.
     */
    var getData = !metaMap ? noop : function(func) {
      return metaMap.get(func);
    };

    /**
     * Gets the name of `func`.
     *
     * @private
     * @param {Function} func The function to query.
     * @returns {string} Returns the function name.
     */
    var getFuncName = (function() {
      if (!support.funcNames) {
        return constant('');
      }
      if (constant.name == 'constant') {
        return baseProperty('name');
      }
      return function(func) {
        var result = func.name,
            array = realNames[result],
            length = array ? array.length : 0;

        while (length--) {
          var data = array[length],
              otherFunc = data.func;

          if (otherFunc == null || otherFunc == func) {
            return data.name;
          }
        }
        return result;
      };
    }());

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized this function returns the custom method, otherwise it returns
     * the `baseIndexOf` function. If arguments are provided the chosen function
     * is invoked with them and its result is returned.
     *
     * @private
     * @returns {Function|number} Returns the chosen function or its result.
     */
    function getIndexOf(collection, target, fromIndex) {
      var result = lodash.indexOf || indexOf;
      result = result === indexOf ? baseIndexOf : result;
      return collection ? result(collection, target, fromIndex) : result;
    }

    /**
     * Gets the "length" property value of `object`.
     *
     * **Note:** This function is used to avoid a [JIT bug](https://bugs.webkit.org/show_bug.cgi?id=142792)
     * in Safari on iOS 8.1 ARM64.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {*} Returns the "length" value.
     */
    var getLength = baseProperty('length');

    /**
     * Creates an array of the own symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of symbols.
     */
    var getSymbols = !getOwnPropertySymbols ? constant([]) : function(object) {
      return getOwnPropertySymbols(toObject(object));
    };

    /**
     * Gets the view, applying any `transforms` to the `start` and `end` positions.
     *
     * @private
     * @param {number} start The start of the view.
     * @param {number} end The end of the view.
     * @param {Array} [transforms] The transformations to apply to the view.
     * @returns {Object} Returns an object containing the `start` and `end`
     *  positions of the view.
     */
    function getView(start, end, transforms) {
      var index = -1,
          length = transforms ? transforms.length : 0;

      while (++index < length) {
        var data = transforms[index],
            size = data.size;

        switch (data.type) {
          case 'drop':      start += size; break;
          case 'dropRight': end -= size; break;
          case 'take':      end = nativeMin(end, start + size); break;
          case 'takeRight': start = nativeMax(start, end - size); break;
        }
      }
      return { 'start': start, 'end': end };
    }

    /**
     * Initializes an array clone.
     *
     * @private
     * @param {Array} array The array to clone.
     * @returns {Array} Returns the initialized clone.
     */
    function initCloneArray(array) {
      var length = array.length,
          result = new array.constructor(length);

      // Add array properties assigned by `RegExp#exec`.
      if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
        result.index = array.index;
        result.input = array.input;
      }
      return result;
    }

    /**
     * Initializes an object clone.
     *
     * @private
     * @param {Object} object The object to clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneObject(object) {
      var Ctor = object.constructor;
      if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
        Ctor = Object;
      }
      return new Ctor;
    }

    /**
     * Initializes an object clone based on its `toStringTag`.
     *
     * **Note:** This function only supports cloning values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to clone.
     * @param {string} tag The `toStringTag` of the object to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneByTag(object, tag, isDeep) {
      var Ctor = object.constructor;
      switch (tag) {
        case arrayBufferTag:
          return bufferClone(object);

        case boolTag:
        case dateTag:
          return new Ctor(+object);

        case float32Tag: case float64Tag:
        case int8Tag: case int16Tag: case int32Tag:
        case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
          var buffer = object.buffer;
          return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);

        case numberTag:
        case stringTag:
          return new Ctor(object);

        case regexpTag:
          var result = new Ctor(object.source, reFlags.exec(object));
          result.lastIndex = object.lastIndex;
      }
      return result;
    }

    /**
     * Invokes the method at `path` on `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the method to invoke.
     * @param {Array} args The arguments to invoke the method with.
     * @returns {*} Returns the result of the invoked method.
     */
    function invokePath(object, path, args) {
      if (object != null && !isKey(path, object)) {
        path = toPath(path);
        object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
        path = last(path);
      }
      var func = object == null ? object : object[path];
      return func == null ? undefined : func.apply(object, args);
    }

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      value = +value;
      length = length == null ? MAX_SAFE_INTEGER : length;
      return value > -1 && value % 1 == 0 && value < length;
    }

    /**
     * Checks if the provided arguments are from an iteratee call.
     *
     * @private
     * @param {*} value The potential iteratee value argument.
     * @param {*} index The potential iteratee index or key argument.
     * @param {*} object The potential iteratee object argument.
     * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.
     */
    function isIterateeCall(value, index, object) {
      if (!isObject(object)) {
        return false;
      }
      var type = typeof index;
      if (type == 'number') {
        var length = getLength(object),
            prereq = isLength(length) && isIndex(index, length);
      } else {
        prereq = type == 'string' && index in object;
      }
      if (prereq) {
        var other = object[index];
        return value === value ? (value === other) : (other !== other);
      }
      return false;
    }

    /**
     * Checks if `value` is a property name and not a property path.
     *
     * @private
     * @param {*} value The value to check.
     * @param {Object} [object] The object to query keys on.
     * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
     */
    function isKey(value, object) {
      var type = typeof value;
      if ((type == 'string' && reIsPlainProp.test(value)) || type == 'number') {
        return true;
      }
      if (isArray(value)) {
        return false;
      }
      var result = !reIsDeepProp.test(value);
      return result || (object != null && value in toObject(object));
    }

    /**
     * Checks if `func` has a lazy counterpart.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` has a lazy counterpart, else `false`.
     */
    function isLaziable(func) {
      var funcName = getFuncName(func);
      return !!funcName && func === lodash[funcName] && funcName in LazyWrapper.prototype;
    }

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This function is based on [`ToLength`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength).
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     */
    function isLength(value) {
      return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }

    /**
     * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` if suitable for strict
     *  equality comparisons, else `false`.
     */
    function isStrictComparable(value) {
      return value === value && (value === 0 ? ((1 / value) > 0) : !isObject(value));
    }

    /**
     * Merges the function metadata of `source` into `data`.
     *
     * Merging metadata reduces the number of wrappers required to invoke a function.
     * This is possible because methods like `_.bind`, `_.curry`, and `_.partial`
     * may be applied regardless of execution order. Methods like `_.ary` and `_.rearg`
     * augment function arguments, making the order in which they are executed important,
     * preventing the merging of metadata. However, we make an exception for a safe
     * common case where curried functions have `_.ary` and or `_.rearg` applied.
     *
     * @private
     * @param {Array} data The destination metadata.
     * @param {Array} source The source metadata.
     * @returns {Array} Returns `data`.
     */
    function mergeData(data, source) {
      var bitmask = data[1],
          srcBitmask = source[1],
          newBitmask = bitmask | srcBitmask,
          isCommon = newBitmask < ARY_FLAG;

      var isCombo =
        (srcBitmask == ARY_FLAG && bitmask == CURRY_FLAG) ||
        (srcBitmask == ARY_FLAG && bitmask == REARG_FLAG && data[7].length <= source[8]) ||
        (srcBitmask == (ARY_FLAG | REARG_FLAG) && bitmask == CURRY_FLAG);

      // Exit early if metadata can't be merged.
      if (!(isCommon || isCombo)) {
        return data;
      }
      // Use source `thisArg` if available.
      if (srcBitmask & BIND_FLAG) {
        data[2] = source[2];
        // Set when currying a bound function.
        newBitmask |= (bitmask & BIND_FLAG) ? 0 : CURRY_BOUND_FLAG;
      }
      // Compose partial arguments.
      var value = source[3];
      if (value) {
        var partials = data[3];
        data[3] = partials ? composeArgs(partials, value, source[4]) : arrayCopy(value);
        data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : arrayCopy(source[4]);
      }
      // Compose partial right arguments.
      value = source[5];
      if (value) {
        partials = data[5];
        data[5] = partials ? composeArgsRight(partials, value, source[6]) : arrayCopy(value);
        data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : arrayCopy(source[6]);
      }
      // Use source `argPos` if available.
      value = source[7];
      if (value) {
        data[7] = arrayCopy(value);
      }
      // Use source `ary` if it's smaller.
      if (srcBitmask & ARY_FLAG) {
        data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
      }
      // Use source `arity` if one is not provided.
      if (data[9] == null) {
        data[9] = source[9];
      }
      // Use source `func` and merge bitmasks.
      data[0] = source[0];
      data[1] = newBitmask;

      return data;
    }

    /**
     * A specialized version of `_.pick` that picks `object` properties specified
     * by `props`.
     *
     * @private
     * @param {Object} object The source object.
     * @param {string[]} props The property names to pick.
     * @returns {Object} Returns the new object.
     */
    function pickByArray(object, props) {
      object = toObject(object);

      var index = -1,
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        if (key in object) {
          result[key] = object[key];
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.pick` that picks `object` properties `predicate`
     * returns truthy for.
     *
     * @private
     * @param {Object} object The source object.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Object} Returns the new object.
     */
    function pickByCallback(object, predicate) {
      var result = {};
      baseForIn(object, function(value, key, object) {
        if (predicate(value, key, object)) {
          result[key] = value;
        }
      });
      return result;
    }

    /**
     * Reorder `array` according to the specified indexes where the element at
     * the first index is assigned as the first element, the element at
     * the second index is assigned as the second element, and so on.
     *
     * @private
     * @param {Array} array The array to reorder.
     * @param {Array} indexes The arranged array indexes.
     * @returns {Array} Returns `array`.
     */
    function reorder(array, indexes) {
      var arrLength = array.length,
          length = nativeMin(indexes.length, arrLength),
          oldArray = arrayCopy(array);

      while (length--) {
        var index = indexes[length];
        array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined;
      }
      return array;
    }

    /**
     * Sets metadata for `func`.
     *
     * **Note:** If this function becomes hot, i.e. is invoked a lot in a short
     * period of time, it will trip its breaker and transition to an identity function
     * to avoid garbage collection pauses in V8. See [V8 issue 2070](https://code.google.com/p/v8/issues/detail?id=2070)
     * for more details.
     *
     * @private
     * @param {Function} func The function to associate metadata with.
     * @param {*} data The metadata.
     * @returns {Function} Returns `func`.
     */
    var setData = (function() {
      var count = 0,
          lastCalled = 0;

      return function(key, value) {
        var stamp = now(),
            remaining = HOT_SPAN - (stamp - lastCalled);

        lastCalled = stamp;
        if (remaining > 0) {
          if (++count >= HOT_COUNT) {
            return key;
          }
        } else {
          count = 0;
        }
        return baseSetData(key, value);
      };
    }());

    /**
     * A fallback implementation of `_.isPlainObject` which checks if `value`
     * is an object created by the `Object` constructor or has a `[[Prototype]]`
     * of `null`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var Ctor,
          support = lodash.support;

      // Exit early for non `Object` objects.
      if (!(isObjectLike(value) && objToString.call(value) == objectTag) ||
          (!hasOwnProperty.call(value, 'constructor') &&
            (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor)))) {
        return false;
      }
      // IE < 9 iterates inherited properties before own properties. If the first
      // iterated property is an object's own property then there are no inherited
      // enumerable properties.
      var result;
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      baseForIn(value, function(subValue, key) {
        result = key;
      });
      return result === undefined || hasOwnProperty.call(value, result);
    }

    /**
     * A fallback implementation of `Object.keys` which creates an array of the
     * own enumerable property names of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function shimKeys(object) {
      var props = keysIn(object),
          propsLength = props.length,
          length = propsLength && object.length,
          support = lodash.support;

      var allowIndexes = length && isLength(length) &&
        (isArray(object) || (support.nonEnumArgs && isArguments(object)));

      var index = -1,
          result = [];

      while (++index < propsLength) {
        var key = props[index];
        if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Converts `value` to an array-like object if it is not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Array|Object} Returns the array-like object.
     */
    function toIterable(value) {
      if (value == null) {
        return [];
      }
      if (!isLength(getLength(value))) {
        return values(value);
      }
      return isObject(value) ? value : Object(value);
    }

    /**
     * Converts `value` to an object if it is not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Object} Returns the object.
     */
    function toObject(value) {
      return isObject(value) ? value : Object(value);
    }

    /**
     * Converts `value` to property path array if it is not one.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {Array} Returns the property path array.
     */
    function toPath(value) {
      if (isArray(value)) {
        return value;
      }
      var result = [];
      baseToString(value).replace(rePropName, function(match, number, quote, string) {
        result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
      });
      return result;
    }

    /**
     * Creates a clone of `wrapper`.
     *
     * @private
     * @param {Object} wrapper The wrapper to clone.
     * @returns {Object} Returns the cloned wrapper.
     */
    function wrapperClone(wrapper) {
      return wrapper instanceof LazyWrapper
        ? wrapper.clone()
        : new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__, arrayCopy(wrapper.__actions__));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates an array of elements split into groups the length of `size`.
     * If `collection` can't be split evenly, the final chunk will be the remaining
     * elements.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to process.
     * @param {number} [size=1] The length of each chunk.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the new array containing chunks.
     * @example
     *
     * _.chunk(['a', 'b', 'c', 'd'], 2);
     * // => [['a', 'b'], ['c', 'd']]
     *
     * _.chunk(['a', 'b', 'c', 'd'], 3);
     * // => [['a', 'b', 'c'], ['d']]
     */
    function chunk(array, size, guard) {
      if (guard ? isIterateeCall(array, size, guard) : size == null) {
        size = 1;
      } else {
        size = nativeMax(+size || 1, 1);
      }
      var index = 0,
          length = array ? array.length : 0,
          resIndex = -1,
          result = Array(ceil(length / size));

      while (index < length) {
        result[++resIndex] = baseSlice(array, index, (index += size));
      }
      return result;
    }

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are falsey.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to compact.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          resIndex = -1,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result[++resIndex] = value;
        }
      }
      return result;
    }

    /**
     * Creates an array excluding all values of the provided arrays using
     * `SameValueZero` for equality comparisons.
     *
     * **Note:** [`SameValueZero`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)
     * comparisons are like strict equality comparisons, e.g. `===`, except that
     * `NaN` matches `NaN`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3], [4, 2]);
     * // => [1, 3]
     */
    var difference = restParam(function(array, values) {
      return (isArray(array) || isArguments(array))
        ? baseDifference(array, baseFlatten(values, false, true))
        : [];
    });

    /**
     * Creates a slice of `array` with `n` elements dropped from the beginning.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to drop.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.drop([1, 2, 3]);
     * // => [2, 3]
     *
     * _.drop([1, 2, 3], 2);
     * // => [3]
     *
     * _.drop([1, 2, 3], 5);
     * // => []
     *
     * _.drop([1, 2, 3], 0);
     * // => [1, 2, 3]
     */
    function drop(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      return baseSlice(array, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` with `n` elements dropped from the end.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to drop.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.dropRight([1, 2, 3]);
     * // => [1, 2]
     *
     * _.dropRight([1, 2, 3], 2);
     * // => [1]
     *
     * _.dropRight([1, 2, 3], 5);
     * // => []
     *
     * _.dropRight([1, 2, 3], 0);
     * // => [1, 2, 3]
     */
    function dropRight(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      n = length - (+n || 0);
      return baseSlice(array, 0, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` excluding elements dropped from the end.
     * Elements are dropped until `predicate` returns falsey. The predicate is
     * bound to `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that match the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.dropRightWhile([1, 2, 3], function(n) {
     *   return n > 1;
     * });
     * // => [1]
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.dropRightWhile(users, { 'user': 'pebbles', 'active': false }), 'user');
     * // => ['barney', 'fred']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.dropRightWhile(users, 'active', false), 'user');
     * // => ['barney']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.dropRightWhile(users, 'active'), 'user');
     * // => ['barney', 'fred', 'pebbles']
     */
    function dropRightWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3), true, true)
        : [];
    }

    /**
     * Creates a slice of `array` excluding elements dropped from the beginning.
     * Elements are dropped until `predicate` returns falsey. The predicate is
     * bound to `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.dropWhile([1, 2, 3], function(n) {
     *   return n < 3;
     * });
     * // => [3]
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.dropWhile(users, { 'user': 'barney', 'active': false }), 'user');
     * // => ['fred', 'pebbles']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.dropWhile(users, 'active', false), 'user');
     * // => ['pebbles']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.dropWhile(users, 'active'), 'user');
     * // => ['barney', 'fred', 'pebbles']
     */
    function dropWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3), true)
        : [];
    }

    /**
     * Fills elements of `array` with `value` from `start` up to, but not
     * including, `end`.
     *
     * **Note:** This method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to fill.
     * @param {*} value The value to fill `array` with.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3];
     *
     * _.fill(array, 'a');
     * console.log(array);
     * // => ['a', 'a', 'a']
     *
     * _.fill(Array(3), 2);
     * // => [2, 2, 2]
     *
     * _.fill([4, 6, 8], '*', 1, 2);
     * // => [4, '*', 8]
     */
    function fill(array, value, start, end) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (start && typeof start != 'number' && isIterateeCall(array, value, start)) {
        start = 0;
        end = length;
      }
      return baseFill(array, value, start, end);
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element `predicate` returns truthy for instead of the element itself.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * _.findIndex(users, function(chr) {
     *   return chr.user == 'barney';
     * });
     * // => 0
     *
     * // using the `_.matches` callback shorthand
     * _.findIndex(users, { 'user': 'fred', 'active': false });
     * // => 1
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findIndex(users, 'active', false);
     * // => 0
     *
     * // using the `_.property` callback shorthand
     * _.findIndex(users, 'active');
     * // => 2
     */
    var findIndex = createFindIndex();

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of `collection` from right to left.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * _.findLastIndex(users, function(chr) {
     *   return chr.user == 'pebbles';
     * });
     * // => 2
     *
     * // using the `_.matches` callback shorthand
     * _.findLastIndex(users, { 'user': 'barney', 'active': true });
     * // => 0
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findLastIndex(users, 'active', false);
     * // => 2
     *
     * // using the `_.property` callback shorthand
     * _.findLastIndex(users, 'active');
     * // => 0
     */
    var findLastIndex = createFindIndex(true);

    /**
     * Gets the first element of `array`.
     *
     * @static
     * @memberOf _
     * @alias head
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the first element of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([]);
     * // => undefined
     */
    function first(array) {
      return array ? array[0] : undefined;
    }

    /**
     * Flattens a nested array. If `isDeep` is `true` the array is recursively
     * flattened, otherwise it is only flattened a single level.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to flatten.
     * @param {boolean} [isDeep] Specify a deep flatten.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * _.flatten([1, [2, 3, [4]]]);
     * // => [1, 2, 3, [4]]
     *
     * // using `isDeep`
     * _.flatten([1, [2, 3, [4]]], true);
     * // => [1, 2, 3, 4]
     */
    function flatten(array, isDeep, guard) {
      var length = array ? array.length : 0;
      if (guard && isIterateeCall(array, isDeep, guard)) {
        isDeep = false;
      }
      return length ? baseFlatten(array, isDeep) : [];
    }

    /**
     * Recursively flattens a nested array.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to recursively flatten.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * _.flattenDeep([1, [2, 3, [4]]]);
     * // => [1, 2, 3, 4]
     */
    function flattenDeep(array) {
      var length = array ? array.length : 0;
      return length ? baseFlatten(array, true) : [];
    }

    /**
     * Gets the index at which the first occurrence of `value` is found in `array`
     * using `SameValueZero` for equality comparisons. If `fromIndex` is negative,
     * it is used as the offset from the end of `array`. If `array` is sorted
     * providing `true` for `fromIndex` performs a faster binary search.
     *
     * **Note:** [`SameValueZero`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)
     * comparisons are like strict equality comparisons, e.g. `===`, except that
     * `NaN` matches `NaN`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.indexOf([1, 2, 1, 2], 2);
     * // => 1
     *
     * // using `fromIndex`
     * _.indexOf([1, 2, 1, 2], 2, 2);
     * // => 3
     *
     * // performing a binary search
     * _.indexOf([1, 1, 2, 2], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      var length = array ? array.length : 0;
      if (!length) {
        return -1;
      }
      if (typeof fromIndex == 'number') {
        fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : fromIndex;
      } else if (fromIndex) {
        var index = binaryIndex(array, value),
            other = array[index];

        if (value === value ? (value === other) : (other !== other)) {
          return index;
        }
        return -1;
      }
      return baseIndexOf(array, value, fromIndex || 0);
    }

    /**
     * Gets all but the last element of `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     */
    function initial(array) {
      return dropRight(array, 1);
    }

    /**
     * Creates an array of unique values in all provided arrays using `SameValueZero`
     * for equality comparisons.
     *
     * **Note:** [`SameValueZero`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)
     * comparisons are like strict equality comparisons, e.g. `===`, except that
     * `NaN` matches `NaN`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of shared values.
     * @example
     * _.intersection([1, 2], [4, 2], [2, 1]);
     * // => [2]
     */
    function intersection() {
      var args = [],
          argsIndex = -1,
          argsLength = arguments.length,
          caches = [],
          indexOf = getIndexOf(),
          isCommon = indexOf == baseIndexOf,
          result = [];

      while (++argsIndex < argsLength) {
        var value = arguments[argsIndex];
        if (isArray(value) || isArguments(value)) {
          args.push(value);
          caches.push((isCommon && value.length >= 120) ? createCache(argsIndex && value) : null);
        }
      }
      argsLength = args.length;
      if (argsLength < 2) {
        return result;
      }
      var array = args[0],
          index = -1,
          length = array ? array.length : 0,
          seen = caches[0];

      outer:
      while (++index < length) {
        value = array[index];
        if ((seen ? cacheIndexOf(seen, value) : indexOf(result, value, 0)) < 0) {
          argsIndex = argsLength;
          while (--argsIndex) {
            var cache = caches[argsIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value, 0)) < 0) {
              continue outer;
            }
          }
          if (seen) {
            seen.push(value);
          }
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Gets the last element of `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the last element of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     */
    function last(array) {
      var length = array ? array.length : 0;
      return length ? array[length - 1] : undefined;
    }

    /**
     * This method is like `_.indexOf` except that it iterates over elements of
     * `array` from right to left.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=array.length-1] The index to search from
     *  or `true` to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 1, 2], 2);
     * // => 3
     *
     * // using `fromIndex`
     * _.lastIndexOf([1, 2, 1, 2], 2, 2);
     * // => 1
     *
     * // performing a binary search
     * _.lastIndexOf([1, 1, 2, 2], 2, true);
     * // => 3
     */
    function lastIndexOf(array, value, fromIndex) {
      var length = array ? array.length : 0;
      if (!length) {
        return -1;
      }
      var index = length;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(length + fromIndex, 0) : nativeMin(fromIndex || 0, length - 1)) + 1;
      } else if (fromIndex) {
        index = binaryIndex(array, value, true) - 1;
        var other = array[index];
        if (value === value ? (value === other) : (other !== other)) {
          return index;
        }
        return -1;
      }
      if (value !== value) {
        return indexOfNaN(array, index, true);
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from `array` using `SameValueZero` for equality
     * comparisons.
     *
     * **Notes:**
     *  - Unlike `_.without`, this method mutates `array`
     *  - [`SameValueZero`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)
     *    comparisons are like strict equality comparisons, e.g. `===`, except
     *    that `NaN` matches `NaN`
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to modify.
     * @param {...*} [values] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     *
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull() {
      var args = arguments,
          array = args[0];

      if (!(array && array.length)) {
        return array;
      }
      var index = 0,
          indexOf = getIndexOf(),
          length = args.length;

      while (++index < length) {
        var fromIndex = 0,
            value = args[index];

        while ((fromIndex = indexOf(array, value, fromIndex)) > -1) {
          splice.call(array, fromIndex, 1);
        }
      }
      return array;
    }

    /**
     * Removes elements from `array` corresponding to the given indexes and returns
     * an array of the removed elements. Indexes may be specified as an array of
     * indexes or as individual arguments.
     *
     * **Note:** Unlike `_.at`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to modify.
     * @param {...(number|number[])} [indexes] The indexes of elements to remove,
     *  specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns the new array of removed elements.
     * @example
     *
     * var array = [5, 10, 15, 20];
     * var evens = _.pullAt(array, 1, 3);
     *
     * console.log(array);
     * // => [5, 15]
     *
     * console.log(evens);
     * // => [10, 20]
     */
    var pullAt = restParam(function(array, indexes) {
      array || (array = []);
      indexes = baseFlatten(indexes);

      var result = baseAt(array, indexes);
      basePullAt(array, indexes.sort(baseCompareAscending));
      return result;
    });

    /**
     * Removes all elements from `array` that `predicate` returns truthy for
     * and returns an array of the removed elements. The predicate is bound to
     * `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * **Note:** Unlike `_.filter`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4];
     * var evens = _.remove(array, function(n) {
     *   return n % 2 == 0;
     * });
     *
     * console.log(array);
     * // => [1, 3]
     *
     * console.log(evens);
     * // => [2, 4]
     */
    function remove(array, predicate, thisArg) {
      var result = [];
      if (!(array && array.length)) {
        return result;
      }
      var index = -1,
          indexes = [],
          length = array.length;

      predicate = getCallback(predicate, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result.push(value);
          indexes.push(index);
        }
      }
      basePullAt(array, indexes);
      return result;
    }

    /**
     * Gets all but the first element of `array`.
     *
     * @static
     * @memberOf _
     * @alias tail
     * @category Array
     * @param {Array} array The array to query.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     */
    function rest(array) {
      return drop(array, 1);
    }

    /**
     * Creates a slice of `array` from `start` up to, but not including, `end`.
     *
     * **Note:** This method is used instead of `Array#slice` to support node
     * lists in IE < 9 and to ensure dense arrays are returned.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function slice(array, start, end) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (end && typeof end != 'number' && isIterateeCall(array, start, end)) {
        start = 0;
        end = length;
      }
      return baseSlice(array, start, end);
    }

    /**
     * Uses a binary search to determine the lowest index at which `value` should
     * be inserted into `array` in order to maintain its sort order. If an iteratee
     * function is provided it is invoked for `value` and each element of `array`
     * to compute their sort ranking. The iteratee is bound to `thisArg` and
     * invoked with one argument; (value).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([30, 50], 40);
     * // => 1
     *
     * _.sortedIndex([4, 4, 5, 5], 5);
     * // => 2
     *
     * var dict = { 'data': { 'thirty': 30, 'forty': 40, 'fifty': 50 } };
     *
     * // using an iteratee function
     * _.sortedIndex(['thirty', 'fifty'], 'forty', function(word) {
     *   return this.data[word];
     * }, dict);
     * // => 1
     *
     * // using the `_.property` callback shorthand
     * _.sortedIndex([{ 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 1
     */
    var sortedIndex = createSortedIndex();

    /**
     * This method is like `_.sortedIndex` except that it returns the highest
     * index at which `value` should be inserted into `array` in order to
     * maintain its sort order.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedLastIndex([4, 4, 5, 5], 5);
     * // => 4
     */
    var sortedLastIndex = createSortedIndex(true);

    /**
     * Creates a slice of `array` with `n` elements taken from the beginning.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to take.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.take([1, 2, 3]);
     * // => [1]
     *
     * _.take([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.take([1, 2, 3], 5);
     * // => [1, 2, 3]
     *
     * _.take([1, 2, 3], 0);
     * // => []
     */
    function take(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      return baseSlice(array, 0, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` with `n` elements taken from the end.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to take.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.takeRight([1, 2, 3]);
     * // => [3]
     *
     * _.takeRight([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.takeRight([1, 2, 3], 5);
     * // => [1, 2, 3]
     *
     * _.takeRight([1, 2, 3], 0);
     * // => []
     */
    function takeRight(array, n, guard) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (guard ? isIterateeCall(array, n, guard) : n == null) {
        n = 1;
      }
      n = length - (+n || 0);
      return baseSlice(array, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` with elements taken from the end. Elements are
     * taken until `predicate` returns falsey. The predicate is bound to `thisArg`
     * and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.takeRightWhile([1, 2, 3], function(n) {
     *   return n > 1;
     * });
     * // => [2, 3]
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.takeRightWhile(users, { 'user': 'pebbles', 'active': false }), 'user');
     * // => ['pebbles']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.takeRightWhile(users, 'active', false), 'user');
     * // => ['fred', 'pebbles']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.takeRightWhile(users, 'active'), 'user');
     * // => []
     */
    function takeRightWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3), false, true)
        : [];
    }

    /**
     * Creates a slice of `array` with elements taken from the beginning. Elements
     * are taken until `predicate` returns falsey. The predicate is bound to
     * `thisArg` and invoked with three arguments: (value, index, array).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.takeWhile([1, 2, 3], function(n) {
     *   return n < 3;
     * });
     * // => [1, 2]
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false},
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.takeWhile(users, { 'user': 'barney', 'active': false }), 'user');
     * // => ['barney']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.takeWhile(users, 'active', false), 'user');
     * // => ['barney', 'fred']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.takeWhile(users, 'active'), 'user');
     * // => []
     */
    function takeWhile(array, predicate, thisArg) {
      return (array && array.length)
        ? baseWhile(array, getCallback(predicate, thisArg, 3))
        : [];
    }

    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * `SameValueZero` for equality comparisons.
     *
     * **Note:** [`SameValueZero`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)
     * comparisons are like strict equality comparisons, e.g. `===`, except that
     * `NaN` matches `NaN`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of combined values.
     * @example
     *
     * _.union([1, 2], [4, 2], [2, 1]);
     * // => [1, 2, 4]
     */
    var union = restParam(function(arrays) {
      return baseUniq(baseFlatten(arrays, false, true));
    });

    /**
     * Creates a duplicate-free version of an array, using `SameValueZero` for
     * equality comparisons, in which only the first occurence of each element
     * is kept. Providing `true` for `isSorted` performs a faster search algorithm
     * for sorted arrays. If an iteratee function is provided it is invoked for
     * each element in the array to generate the criterion by which uniqueness
     * is computed. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index, array).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * **Note:** [`SameValueZero`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)
     * comparisons are like strict equality comparisons, e.g. `===`, except that
     * `NaN` matches `NaN`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {boolean} [isSorted] Specify the array is sorted.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new duplicate-value-free array.
     * @example
     *
     * _.uniq([2, 1, 2]);
     * // => [2, 1]
     *
     * // using `isSorted`
     * _.uniq([1, 1, 2], true);
     * // => [1, 2]
     *
     * // using an iteratee function
     * _.uniq([1, 2.5, 1.5, 2], function(n) {
     *   return this.floor(n);
     * }, Math);
     * // => [1, 2.5]
     *
     * // using the `_.property` callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, iteratee, thisArg) {
      var length = array ? array.length : 0;
      if (!length) {
        return [];
      }
      if (isSorted != null && typeof isSorted != 'boolean') {
        thisArg = iteratee;
        iteratee = isIterateeCall(array, isSorted, thisArg) ? null : isSorted;
        isSorted = false;
      }
      var func = getCallback();
      if (!(func === baseCallback && iteratee == null)) {
        iteratee = func(iteratee, thisArg, 3);
      }
      return (isSorted && getIndexOf() == baseIndexOf)
        ? sortedUniq(array, iteratee)
        : baseUniq(array, iteratee);
    }

    /**
     * This method is like `_.zip` except that it accepts an array of grouped
     * elements and creates an array regrouping the elements to their pre-`_.zip`
     * configuration.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array of grouped elements to process.
     * @returns {Array} Returns the new array of regrouped elements.
     * @example
     *
     * var zipped = _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     *
     * _.unzip(zipped);
     * // => [['fred', 'barney'], [30, 40], [true, false]]
     */
    function unzip(array) {
      var index = -1,
          length = (array && array.length && arrayMax(arrayMap(array, getLength))) >>> 0,
          result = Array(length);

      while (++index < length) {
        result[index] = arrayMap(array, baseProperty(index));
      }
      return result;
    }

    /**
     * Creates an array excluding all provided values using `SameValueZero` for
     * equality comparisons.
     *
     * **Note:** [`SameValueZero`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)
     * comparisons are like strict equality comparisons, e.g. `===`, except that
     * `NaN` matches `NaN`.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {Array} array The array to filter.
     * @param {...*} [values] The values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 3], 1, 2);
     * // => [3]
     */
    var without = restParam(function(array, values) {
      return (isArray(array) || isArguments(array))
        ? baseDifference(array, values)
        : [];
    });

    /**
     * Creates an array that is the [symmetric difference](https://en.wikipedia.org/wiki/Symmetric_difference)
     * of the provided arrays.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of values.
     * @example
     *
     * _.xor([1, 2], [4, 2]);
     * // => [1, 4]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArray(array) || isArguments(array)) {
          var result = result
            ? baseDifference(result, array).concat(baseDifference(array, result))
            : array;
        }
      }
      return result ? baseUniq(result) : [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second elements
     * of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @category Array
     * @param {...Array} [arrays] The arrays to process.
     * @returns {Array} Returns the new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    var zip = restParam(unzip);

    /**
     * The inverse of `_.pairs`; this method returns an object composed from arrays
     * of property names and values. Provide either a single two dimensional array,
     * e.g. `[[key1, value1], [key2, value2]]` or two arrays, one of property names
     * and one of corresponding values.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Array
     * @param {Array} props The property names.
     * @param {Array} [values=[]] The property values.
     * @returns {Object} Returns the new object.
     * @example
     *
     * _.zipObject([['fred', 30], ['barney', 40]]);
     * // => { 'fred': 30, 'barney': 40 }
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(props, values) {
      var index = -1,
          length = props ? props.length : 0,
          result = {};

      if (length && !values && !isArray(props[0])) {
        values = [];
      }
      while (++index < length) {
        var key = props[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps `value` with explicit method
     * chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chain
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36 },
     *   { 'user': 'fred',    'age': 40 },
     *   { 'user': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(users)
     *   .sortBy('age')
     *   .map(function(chr) {
     *     return chr.user + ' is ' + chr.age;
     *   })
     *   .first()
     *   .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      var result = lodash(value);
      result.__chain__ = true;
      return result;
    }

    /**
     * This method invokes `interceptor` and returns `value`. The interceptor is
     * bound to `thisArg` and invoked with one argument; (value). The purpose of
     * this method is to "tap into" a method chain in order to perform operations
     * on intermediate results within the chain.
     *
     * @static
     * @memberOf _
     * @category Chain
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @param {*} [thisArg] The `this` binding of `interceptor`.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3])
     *  .tap(function(array) {
     *    array.pop();
     *  })
     *  .reverse()
     *  .value();
     * // => [2, 1]
     */
    function tap(value, interceptor, thisArg) {
      interceptor.call(thisArg, value);
      return value;
    }

    /**
     * This method is like `_.tap` except that it returns the result of `interceptor`.
     *
     * @static
     * @memberOf _
     * @category Chain
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @param {*} [thisArg] The `this` binding of `interceptor`.
     * @returns {*} Returns the result of `interceptor`.
     * @example
     *
     * _('  abc  ')
     *  .chain()
     *  .trim()
     *  .thru(function(value) {
     *    return [value];
     *  })
     *  .value();
     * // => ['abc']
     */
    function thru(value, interceptor, thisArg) {
      return interceptor.call(thisArg, value);
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(users).first();
     * // => { 'user': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(users).chain()
     *   .first()
     *   .pick('user')
     *   .value();
     * // => { 'user': 'barney' }
     */
    function wrapperChain() {
      return chain(this);
    }

    /**
     * Executes the chained sequence and returns the wrapped result.
     *
     * @name commit
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2];
     * var wrapper = _(array).push(3);
     *
     * console.log(array);
     * // => [1, 2]
     *
     * wrapper = wrapper.commit();
     * console.log(array);
     * // => [1, 2, 3]
     *
     * wrapper.last();
     * // => 3
     *
     * console.log(array);
     * // => [1, 2, 3]
     */
    function wrapperCommit() {
      return new LodashWrapper(this.value(), this.__chain__);
    }

    /**
     * Creates a clone of the chained sequence planting `value` as the wrapped value.
     *
     * @name plant
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2];
     * var wrapper = _(array).map(function(value) {
     *   return Math.pow(value, 2);
     * });
     *
     * var other = [3, 4];
     * var otherWrapper = wrapper.plant(other);
     *
     * otherWrapper.value();
     * // => [9, 16]
     *
     * wrapper.value();
     * // => [1, 4]
     */
    function wrapperPlant(value) {
      var result,
          parent = this;

      while (parent instanceof baseLodash) {
        var clone = wrapperClone(parent);
        if (result) {
          previous.__wrapped__ = clone;
        } else {
          result = clone;
        }
        var previous = clone;
        parent = parent.__wrapped__;
      }
      previous.__wrapped__ = value;
      return result;
    }

    /**
     * Reverses the wrapped array so the first element becomes the last, the
     * second element becomes the second to last, and so on.
     *
     * **Note:** This method mutates the wrapped array.
     *
     * @name reverse
     * @memberOf _
     * @category Chain
     * @returns {Object} Returns the new reversed `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2, 3];
     *
     * _(array).reverse().value()
     * // => [3, 2, 1]
     *
     * console.log(array);
     * // => [3, 2, 1]
     */
    function wrapperReverse() {
      var value = this.__wrapped__;
      if (value instanceof LazyWrapper) {
        if (this.__actions__.length) {
          value = new LazyWrapper(this);
        }
        return new LodashWrapper(value.reverse(), this.__chain__);
      }
      return this.thru(function(value) {
        return value.reverse();
      });
    }

    /**
     * Produces the result of coercing the unwrapped value to a string.
     *
     * @name toString
     * @memberOf _
     * @category Chain
     * @returns {string} Returns the coerced string value.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return (this.value() + '');
    }

    /**
     * Executes the chained sequence to extract the unwrapped value.
     *
     * @name value
     * @memberOf _
     * @alias run, toJSON, valueOf
     * @category Chain
     * @returns {*} Returns the resolved unwrapped value.
     * @example
     *
     * _([1, 2, 3]).value();
     * // => [1, 2, 3]
     */
    function wrapperValue() {
      return baseWrapperValue(this.__wrapped__, this.__actions__);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates an array of elements corresponding to the given keys, or indexes,
     * of `collection`. Keys may be specified as individual arguments or as arrays
     * of keys.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [props] The property names
     *  or indexes of elements to pick, specified individually or in arrays.
     * @returns {Array} Returns the new array of picked elements.
     * @example
     *
     * _.at(['a', 'b', 'c'], [0, 2]);
     * // => ['a', 'c']
     *
     * _.at(['barney', 'fred', 'pebbles'], 0, 2);
     * // => ['barney', 'pebbles']
     */
    var at = restParam(function(collection, props) {
      var length = collection ? getLength(collection) : 0;
      if (isLength(length)) {
        collection = toIterable(collection);
      }
      return baseAt(collection, baseFlatten(props));
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through `iteratee`. The corresponding value
     * of each key is the number of times the key was returned by `iteratee`.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(n) {
     *   return Math.floor(n);
     * });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(n) {
     *   return this.floor(n);
     * }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      hasOwnProperty.call(result, key) ? ++result[key] : (result[key] = 1);
    });

    /**
     * Checks if `predicate` returns truthy for **all** elements of `collection`.
     * The predicate is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes'], Boolean);
     * // => false
     *
     * var users = [
     *   { 'user': 'barney', 'active': false },
     *   { 'user': 'fred',   'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.every(users, { 'user': 'barney', 'active': false });
     * // => false
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.every(users, 'active', false);
     * // => true
     *
     * // using the `_.property` callback shorthand
     * _.every(users, 'active');
     * // => false
     */
    function every(collection, predicate, thisArg) {
      var func = isArray(collection) ? arrayEvery : baseEvery;
      if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
        predicate = null;
      }
      if (typeof predicate != 'function' || thisArg !== undefined) {
        predicate = getCallback(predicate, thisArg, 3);
      }
      return func(collection, predicate);
    }

    /**
     * Iterates over elements of `collection`, returning an array of all elements
     * `predicate` returns truthy for. The predicate is bound to `thisArg` and
     * invoked with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the new filtered array.
     * @example
     *
     * _.filter([4, 5, 6], function(n) {
     *   return n % 2 == 0;
     * });
     * // => [4, 6]
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.filter(users, { 'age': 36, 'active': true }), 'user');
     * // => ['barney']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.filter(users, 'active', false), 'user');
     * // => ['fred']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.filter(users, 'active'), 'user');
     * // => ['barney']
     */
    function filter(collection, predicate, thisArg) {
      var func = isArray(collection) ? arrayFilter : baseFilter;
      predicate = getCallback(predicate, thisArg, 3);
      return func(collection, predicate);
    }

    /**
     * Iterates over elements of `collection`, returning the first element
     * `predicate` returns truthy for. The predicate is bound to `thisArg` and
     * invoked with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36, 'active': true },
     *   { 'user': 'fred',    'age': 40, 'active': false },
     *   { 'user': 'pebbles', 'age': 1,  'active': true }
     * ];
     *
     * _.result(_.find(users, function(chr) {
     *   return chr.age < 40;
     * }), 'user');
     * // => 'barney'
     *
     * // using the `_.matches` callback shorthand
     * _.result(_.find(users, { 'age': 1, 'active': true }), 'user');
     * // => 'pebbles'
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.result(_.find(users, 'active', false), 'user');
     * // => 'fred'
     *
     * // using the `_.property` callback shorthand
     * _.result(_.find(users, 'active'), 'user');
     * // => 'barney'
     */
    var find = createFind(baseEach);

    /**
     * This method is like `_.find` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(n) {
     *   return n % 2 == 1;
     * });
     * // => 3
     */
    var findLast = createFind(baseEachRight, true);

    /**
     * Performs a deep comparison between each element in `collection` and the
     * source object, returning the first element that has equivalent property
     * values.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. For comparing a single
     * own or inherited property value see `_.matchesProperty`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Object} source The object of property values to match.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * _.result(_.findWhere(users, { 'age': 36, 'active': true }), 'user');
     * // => 'barney'
     *
     * _.result(_.findWhere(users, { 'age': 40, 'active': false }), 'user');
     * // => 'fred'
     */
    function findWhere(collection, source) {
      return find(collection, baseMatches(source));
    }

    /**
     * Iterates over elements of `collection` invoking `iteratee` for each element.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection). Iteratee functions may exit iteration early
     * by explicitly returning `false`.
     *
     * **Note:** As with other "Collections" methods, objects with a "length" property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2]).forEach(function(n) {
     *   console.log(n);
     * }).value();
     * // => logs each value from left to right and returns the array
     *
     * _.forEach({ 'a': 1, 'b': 2 }, function(n, key) {
     *   console.log(n, key);
     * });
     * // => logs each value-key pair and returns the object (iteration order is not guaranteed)
     */
    var forEach = createForEach(arrayEach, baseEach);

    /**
     * This method is like `_.forEach` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2]).forEachRight(function(n) {
     *   console.log(n);
     * }).value();
     * // => logs each value from right to left and returns the array
     */
    var forEachRight = createForEach(arrayEachRight, baseEachRight);

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through `iteratee`. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(n) {
     *   return Math.floor(n);
     * });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(n) {
     *   return this.floor(n);
     * }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using the `_.property` callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      if (hasOwnProperty.call(result, key)) {
        result[key].push(value);
      } else {
        result[key] = [value];
      }
    });

    /**
     * Checks if `value` is in `collection` using `SameValueZero` for equality
     * comparisons. If `fromIndex` is negative, it is used as the offset from
     * the end of `collection`.
     *
     * **Note:** [`SameValueZero`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)
     * comparisons are like strict equality comparisons, e.g. `===`, except that
     * `NaN` matches `NaN`.
     *
     * @static
     * @memberOf _
     * @alias contains, include
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {*} target The value to search for.
     * @param {number} [fromIndex=0] The index to search from.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.reduce`.
     * @returns {boolean} Returns `true` if a matching element is found, else `false`.
     * @example
     *
     * _.includes([1, 2, 3], 1);
     * // => true
     *
     * _.includes([1, 2, 3], 1, 2);
     * // => false
     *
     * _.includes({ 'user': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.includes('pebbles', 'eb');
     * // => true
     */
    function includes(collection, target, fromIndex, guard) {
      var length = collection ? getLength(collection) : 0;
      if (!isLength(length)) {
        collection = values(collection);
        length = collection.length;
      }
      if (!length) {
        return false;
      }
      if (typeof fromIndex != 'number' || (guard && isIterateeCall(target, fromIndex, guard))) {
        fromIndex = 0;
      } else {
        fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : (fromIndex || 0);
      }
      return (typeof collection == 'string' || !isArray(collection) && isString(collection))
        ? (fromIndex < length && collection.indexOf(target, fromIndex) > -1)
        : (getIndexOf(collection, target, fromIndex) > -1);
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through `iteratee`. The corresponding value
     * of each key is the last element responsible for generating the key. The
     * iteratee function is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keyData = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keyData, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keyData, function(object) {
     *   return String.fromCharCode(object.code);
     * });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keyData, function(object) {
     *   return this.fromCharCode(object.code);
     * }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method at `path` on each element in `collection`, returning
     * an array of the results of each invoked method. Any additional arguments
     * are provided to each invoked method. If `methodName` is a function it is
     * invoked for, and `this` bound to, each element in `collection`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|string} path The path of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [args] The arguments to invoke the method with.
     * @returns {Array} Returns the array of results.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    var invoke = restParam(function(collection, path, args) {
      var index = -1,
          isFunc = typeof path == 'function',
          isProp = isKey(path),
          length = getLength(collection),
          result = isLength(length) ? Array(length) : [];

      baseEach(collection, function(value) {
        var func = isFunc ? path : (isProp && value != null && value[path]);
        result[++index] = func ? func.apply(value, args) : invokePath(value, path, args);
      });
      return result;
    });

    /**
     * Creates an array of values by running each element in `collection` through
     * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * Many lodash methods are guarded to work as interatees for methods like
     * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
     *
     * The guarded methods are:
     * `ary`, `callback`, `chunk`, `clone`, `create`, `curry`, `curryRight`, `drop`,
     * `dropRight`, `every`, `fill`, `flatten`, `invert`, `max`, `min`, `parseInt`,
     * `slice`, `sortBy`, `take`, `takeRight`, `template`, `trim`, `trimLeft`,
     * `trimRight`, `trunc`, `random`, `range`, `sample`, `some`, `uniq`, and `words`
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new mapped array.
     * @example
     *
     * function timesThree(n) {
     *   return n * 3;
     * }
     *
     * _.map([1, 2], timesThree);
     * // => [3, 6]
     *
     * _.map({ 'a': 1, 'b': 2 }, timesThree);
     * // => [3, 6] (iteration order is not guaranteed)
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * // using the `_.property` callback shorthand
     * _.map(users, 'user');
     * // => ['barney', 'fred']
     */
    function map(collection, iteratee, thisArg) {
      var func = isArray(collection) ? arrayMap : baseMap;
      iteratee = getCallback(iteratee, thisArg, 3);
      return func(collection, iteratee);
    }

    /**
     * Creates an array of elements split into two groups, the first of which
     * contains elements `predicate` returns truthy for, while the second of which
     * contains elements `predicate` returns falsey for. The predicate is bound
     * to `thisArg` and invoked with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the array of grouped elements.
     * @example
     *
     * _.partition([1, 2, 3], function(n) {
     *   return n % 2;
     * });
     * // => [[1, 3], [2]]
     *
     * _.partition([1.2, 2.3, 3.4], function(n) {
     *   return this.floor(n) % 2;
     * }, Math);
     * // => [[1.2, 3.4], [2.3]]
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36, 'active': false },
     *   { 'user': 'fred',    'age': 40, 'active': true },
     *   { 'user': 'pebbles', 'age': 1,  'active': false }
     * ];
     *
     * var mapper = function(array) {
     *   return _.pluck(array, 'user');
     * };
     *
     * // using the `_.matches` callback shorthand
     * _.map(_.partition(users, { 'age': 1, 'active': false }), mapper);
     * // => [['pebbles'], ['barney', 'fred']]
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.map(_.partition(users, 'active', false), mapper);
     * // => [['barney', 'pebbles'], ['fred']]
     *
     * // using the `_.property` callback shorthand
     * _.map(_.partition(users, 'active'), mapper);
     * // => [['fred'], ['barney', 'pebbles']]
     */
    var partition = createAggregator(function(result, value, key) {
      result[key ? 0 : 1].push(value);
    }, function() { return [[], []]; });

    /**
     * Gets the property value of `path` from all elements in `collection`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|string} path The path of the property to pluck.
     * @returns {Array} Returns the property values.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(users, 'user');
     * // => ['barney', 'fred']
     *
     * var userIndex = _.indexBy(users, 'user');
     * _.pluck(userIndex, 'age');
     * // => [36, 40] (iteration order is not guaranteed)
     */
    function pluck(collection, path) {
      return map(collection, property(path));
    }

    /**
     * Reduces `collection` to a value which is the accumulated result of running
     * each element in `collection` through `iteratee`, where each successive
     * invocation is supplied the return value of the previous. If `accumulator`
     * is not provided the first element of `collection` is used as the initial
     * value. The `iteratee` is bound to `thisArg` and invoked with four arguments:
     * (accumulator, value, index|key, collection).
     *
     * Many lodash methods are guarded to work as interatees for methods like
     * `_.reduce`, `_.reduceRight`, and `_.transform`.
     *
     * The guarded methods are:
     * `assign`, `defaults`, `includes`, `merge`, `sortByAll`, and `sortByOrder`
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * _.reduce([1, 2], function(total, n) {
     *   return total + n;
     * });
     * // => 3
     *
     * _.reduce({ 'a': 1, 'b': 2 }, function(result, n, key) {
     *   result[key] = n * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6 } (iteration order is not guaranteed)
     */
    var reduce = createReduce(arrayReduce, baseEach);

    /**
     * This method is like `_.reduce` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var array = [[0, 1], [2, 3], [4, 5]];
     *
     * _.reduceRight(array, function(flattened, other) {
     *   return flattened.concat(other);
     * }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    var reduceRight =  createReduce(arrayReduceRight, baseEachRight);

    /**
     * The opposite of `_.filter`; this method returns the elements of `collection`
     * that `predicate` does **not** return truthy for.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Array} Returns the new filtered array.
     * @example
     *
     * _.reject([1, 2, 3, 4], function(n) {
     *   return n % 2 == 0;
     * });
     * // => [1, 3]
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': false },
     *   { 'user': 'fred',   'age': 40, 'active': true }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.pluck(_.reject(users, { 'age': 40, 'active': true }), 'user');
     * // => ['barney']
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.pluck(_.reject(users, 'active', false), 'user');
     * // => ['fred']
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.reject(users, 'active'), 'user');
     * // => ['barney']
     */
    function reject(collection, predicate, thisArg) {
      var func = isArray(collection) ? arrayFilter : baseFilter;
      predicate = getCallback(predicate, thisArg, 3);
      return func(collection, function(value, index, collection) {
        return !predicate(value, index, collection);
      });
    }

    /**
     * Gets a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {*} Returns the random sample(s).
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (guard ? isIterateeCall(collection, n, guard) : n == null) {
        collection = toIterable(collection);
        var length = collection.length;
        return length > 0 ? collection[baseRandom(0, length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(n < 0 ? 0 : (+n || 0), result.length);
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the
     * [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle).
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns the new shuffled array.
     * @example
     *
     * _.shuffle([1, 2, 3, 4]);
     * // => [4, 1, 3, 2]
     */
    function shuffle(collection) {
      collection = toIterable(collection);

      var index = -1,
          length = collection.length,
          result = Array(length);

      while (++index < length) {
        var rand = baseRandom(0, index);
        if (index != rand) {
          result[index] = result[rand];
        }
        result[rand] = collection[index];
      }
      return result;
    }

    /**
     * Gets the size of `collection` by returning its length for array-like
     * values or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns the size of `collection`.
     * @example
     *
     * _.size([1, 2, 3]);
     * // => 3
     *
     * _.size({ 'a': 1, 'b': 2 });
     * // => 2
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? getLength(collection) : 0;
      return isLength(length) ? length : keys(collection).length;
    }

    /**
     * Checks if `predicate` returns truthy for **any** element of `collection`.
     * The function returns as soon as it finds a passing value and does not iterate
     * over the entire collection. The predicate is bound to `thisArg` and invoked
     * with three arguments: (value, index|key, collection).
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var users = [
     *   { 'user': 'barney', 'active': true },
     *   { 'user': 'fred',   'active': false }
     * ];
     *
     * // using the `_.matches` callback shorthand
     * _.some(users, { 'user': 'barney', 'active': false });
     * // => false
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.some(users, 'active', false);
     * // => true
     *
     * // using the `_.property` callback shorthand
     * _.some(users, 'active');
     * // => true
     */
    function some(collection, predicate, thisArg) {
      var func = isArray(collection) ? arraySome : baseSome;
      if (thisArg && isIterateeCall(collection, predicate, thisArg)) {
        predicate = null;
      }
      if (typeof predicate != 'function' || thisArg !== undefined) {
        predicate = getCallback(predicate, thisArg, 3);
      }
      return func(collection, predicate);
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through `iteratee`. This method performs
     * a stable sort, that is, it preserves the original sort order of equal elements.
     * The `iteratee` is bound to `thisArg` and invoked with three arguments:
     * (value, index|key, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * _.sortBy([1, 2, 3], function(n) {
     *   return Math.sin(n);
     * });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(n) {
     *   return this.sin(n);
     * }, Math);
     * // => [3, 1, 2]
     *
     * var users = [
     *   { 'user': 'fred' },
     *   { 'user': 'pebbles' },
     *   { 'user': 'barney' }
     * ];
     *
     * // using the `_.property` callback shorthand
     * _.pluck(_.sortBy(users, 'user'), 'user');
     * // => ['barney', 'fred', 'pebbles']
     */
    function sortBy(collection, iteratee, thisArg) {
      if (collection == null) {
        return [];
      }
      if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
        iteratee = null;
      }
      var index = -1;
      iteratee = getCallback(iteratee, thisArg, 3);

      var result = baseMap(collection, function(value, key, collection) {
        return { 'criteria': iteratee(value, key, collection), 'index': ++index, 'value': value };
      });
      return baseSortBy(result, compareAscending);
    }

    /**
     * This method is like `_.sortBy` except that it can sort by multiple iteratees
     * or property names.
     *
     * If a property name is provided for an iteratee the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If an object is provided for an iteratee the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(Function|Function[]|Object|Object[]|string|string[])} iteratees
     *  The iteratees to sort by, specified as individual values or arrays of values.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * var users = [
     *   { 'user': 'fred',   'age': 48 },
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 42 },
     *   { 'user': 'barney', 'age': 34 }
     * ];
     *
     * _.map(_.sortByAll(users, ['user', 'age']), _.values);
     * // => [['barney', 34], ['barney', 36], ['fred', 42], ['fred', 48]]
     *
     * _.map(_.sortByAll(users, 'user', function(chr) {
     *   return Math.floor(chr.age / 10);
     * }), _.values);
     * // => [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 42]]
     */
    var sortByAll = restParam(function(collection, iteratees) {
      if (collection == null) {
        return [];
      }
      var guard = iteratees[2];
      if (guard && isIterateeCall(iteratees[0], iteratees[1], guard)) {
        iteratees.length = 1;
      }
      return baseSortByOrder(collection, baseFlatten(iteratees), []);
    });

    /**
     * This method is like `_.sortByAll` except that it allows specifying the
     * sort orders of the iteratees to sort by. A truthy value in `orders` will
     * sort the corresponding property name in ascending order while a falsey
     * value will sort it in descending order.
     *
     * If a property name is provided for an iteratee the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If an object is provided for an iteratee the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
     * @param {boolean[]} orders The sort orders of `iteratees`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.reduce`.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * var users = [
     *   { 'user': 'fred',   'age': 48 },
     *   { 'user': 'barney', 'age': 34 },
     *   { 'user': 'fred',   'age': 42 },
     *   { 'user': 'barney', 'age': 36 }
     * ];
     *
     * // sort by `user` in ascending order and by `age` in descending order
     * _.map(_.sortByOrder(users, ['user', 'age'], [true, false]), _.values);
     * // => [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 42]]
     */
    function sortByOrder(collection, iteratees, orders, guard) {
      if (collection == null) {
        return [];
      }
      if (guard && isIterateeCall(iteratees, orders, guard)) {
        orders = null;
      }
      if (!isArray(iteratees)) {
        iteratees = iteratees == null ? [] : [iteratees];
      }
      if (!isArray(orders)) {
        orders = orders == null ? [] : [orders];
      }
      return baseSortByOrder(collection, iteratees, orders);
    }

    /**
     * Performs a deep comparison between each element in `collection` and the
     * source object, returning an array of all elements that have equivalent
     * property values.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. For comparing a single
     * own or inherited property value see `_.matchesProperty`.
     *
     * @static
     * @memberOf _
     * @category Collection
     * @param {Array|Object|string} collection The collection to search.
     * @param {Object} source The object of property values to match.
     * @returns {Array} Returns the new filtered array.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': false, 'pets': ['hoppy'] },
     *   { 'user': 'fred',   'age': 40, 'active': true, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.pluck(_.where(users, { 'age': 36, 'active': false }), 'user');
     * // => ['barney']
     *
     * _.pluck(_.where(users, { 'pets': ['dino'] }), 'user');
     * // => ['fred']
     */
    function where(collection, source) {
      return filter(collection, baseMatches(source));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Date
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => logs the number of milliseconds it took for the deferred function to be invoked
     */
    var now = nativeNow || function() {
      return new Date().getTime();
    };

    /*------------------------------------------------------------------------*/

    /**
     * The opposite of `_.before`; this method creates a function that invokes
     * `func` once it is called `n` or more times.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {number} n The number of calls before `func` is invoked.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'done saving!' after the two async saves have completed
     */
    function after(n, func) {
      if (typeof func != 'function') {
        if (typeof n == 'function') {
          var temp = n;
          n = func;
          func = temp;
        } else {
          throw new TypeError(FUNC_ERROR_TEXT);
        }
      }
      n = nativeIsFinite(n = +n) ? n : 0;
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that accepts up to `n` arguments ignoring any
     * additional arguments.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to cap arguments for.
     * @param {number} [n=func.length] The arity cap.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the new function.
     * @example
     *
     * _.map(['6', '8', '10'], _.ary(parseInt, 1));
     * // => [6, 8, 10]
     */
    function ary(func, n, guard) {
      if (guard && isIterateeCall(func, n, guard)) {
        n = null;
      }
      n = (func && n == null) ? func.length : nativeMax(+n || 0, 0);
      return createWrapper(func, ARY_FLAG, null, null, null, null, n);
    }

    /**
     * Creates a function that invokes `func`, with the `this` binding and arguments
     * of the created function, while it is called less than `n` times. Subsequent
     * calls to the created function return the result of the last `func` invocation.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {number} n The number of calls at which `func` is no longer invoked.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * jQuery('#add').on('click', _.before(5, addContactToList));
     * // => allows adding up to 4 contacts to the list
     */
    function before(n, func) {
      var result;
      if (typeof func != 'function') {
        if (typeof n == 'function') {
          var temp = n;
          n = func;
          func = temp;
        } else {
          throw new TypeError(FUNC_ERROR_TEXT);
        }
      }
      return function() {
        if (--n > 0) {
          result = func.apply(this, arguments);
        }
        if (n <= 1) {
          func = null;
        }
        return result;
      };
    }

    /**
     * Creates a function that invokes `func` with the `this` binding of `thisArg`
     * and prepends any additional `_.bind` arguments to those provided to the
     * bound function.
     *
     * The `_.bind.placeholder` value, which defaults to `_` in monolithic builds,
     * may be used as a placeholder for partially applied arguments.
     *
     * **Note:** Unlike native `Function#bind` this method does not set the "length"
     * property of bound functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to bind.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var greet = function(greeting, punctuation) {
     *   return greeting + ' ' + this.user + punctuation;
     * };
     *
     * var object = { 'user': 'fred' };
     *
     * var bound = _.bind(greet, object, 'hi');
     * bound('!');
     * // => 'hi fred!'
     *
     * // using placeholders
     * var bound = _.bind(greet, object, _, '!');
     * bound('hi');
     * // => 'hi fred!'
     */
    var bind = restParam(function(func, thisArg, partials) {
      var bitmask = BIND_FLAG;
      if (partials.length) {
        var holders = replaceHolders(partials, bind.placeholder);
        bitmask |= PARTIAL_FLAG;
      }
      return createWrapper(func, bitmask, thisArg, partials, holders);
    });

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all enumerable function
     * properties, own and inherited, of `object` are bound.
     *
     * **Note:** This method does not set the "length" property of bound functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...(string|string[])} [methodNames] The object method names to bind,
     *  specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() {
     *     console.log('clicked ' + this.label);
     *   }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs' when the element is clicked
     */
    var bindAll = restParam(function(object, methodNames) {
      methodNames = methodNames.length ? baseFlatten(methodNames) : functions(object);

      var index = -1,
          length = methodNames.length;

      while (++index < length) {
        var key = methodNames[index];
        object[key] = createWrapper(object[key], BIND_FLAG, object);
      }
      return object;
    });

    /**
     * Creates a function that invokes the method at `object[key]` and prepends
     * any additional `_.bindKey` arguments to those provided to the bound function.
     *
     * This method differs from `_.bind` by allowing bound functions to reference
     * methods that may be redefined or don't yet exist.
     * See [Peter Michaux's article](http://peter.michaux.ca/articles/lazy-function-definition-pattern)
     * for more details.
     *
     * The `_.bindKey.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'user': 'fred',
     *   'greet': function(greeting, punctuation) {
     *     return greeting + ' ' + this.user + punctuation;
     *   }
     * };
     *
     * var bound = _.bindKey(object, 'greet', 'hi');
     * bound('!');
     * // => 'hi fred!'
     *
     * object.greet = function(greeting, punctuation) {
     *   return greeting + 'ya ' + this.user + punctuation;
     * };
     *
     * bound('!');
     * // => 'hiya fred!'
     *
     * // using placeholders
     * var bound = _.bindKey(object, 'greet', _, '!');
     * bound('hi');
     * // => 'hiya fred!'
     */
    var bindKey = restParam(function(object, key, partials) {
      var bitmask = BIND_FLAG | BIND_KEY_FLAG;
      if (partials.length) {
        var holders = replaceHolders(partials, bindKey.placeholder);
        bitmask |= PARTIAL_FLAG;
      }
      return createWrapper(key, bitmask, object, partials, holders);
    });

    /**
     * Creates a function that accepts one or more arguments of `func` that when
     * called either invokes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` may be specified
     * if `func.length` is not sufficient.
     *
     * The `_.curry.placeholder` value, which defaults to `_` in monolithic builds,
     * may be used as a placeholder for provided arguments.
     *
     * **Note:** This method does not set the "length" property of curried functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var abc = function(a, b, c) {
     *   return [a, b, c];
     * };
     *
     * var curried = _.curry(abc);
     *
     * curried(1)(2)(3);
     * // => [1, 2, 3]
     *
     * curried(1, 2)(3);
     * // => [1, 2, 3]
     *
     * curried(1, 2, 3);
     * // => [1, 2, 3]
     *
     * // using placeholders
     * curried(1)(_, 3)(2);
     * // => [1, 2, 3]
     */
    var curry = createCurry(CURRY_FLAG);

    /**
     * This method is like `_.curry` except that arguments are applied to `func`
     * in the manner of `_.partialRight` instead of `_.partial`.
     *
     * The `_.curryRight.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for provided arguments.
     *
     * **Note:** This method does not set the "length" property of curried functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var abc = function(a, b, c) {
     *   return [a, b, c];
     * };
     *
     * var curried = _.curryRight(abc);
     *
     * curried(3)(2)(1);
     * // => [1, 2, 3]
     *
     * curried(2, 3)(1);
     * // => [1, 2, 3]
     *
     * curried(1, 2, 3);
     * // => [1, 2, 3]
     *
     * // using placeholders
     * curried(3)(1, _)(2);
     * // => [1, 2, 3]
     */
    var curryRight = createCurry(CURRY_RIGHT_FLAG);

    /**
     * Creates a function that delays invoking `func` until after `wait` milliseconds
     * have elapsed since the last time it was invoked. The created function comes
     * with a `cancel` method to cancel delayed invocations. Provide an options
     * object to indicate that `func` should be invoked on the leading and/or
     * trailing edge of the `wait` timeout. Subsequent calls to the debounced
     * function return the result of the last `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify invoking on the leading
     *  edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be
     *  delayed before it is invoked.
     * @param {boolean} [options.trailing=true] Specify invoking on the trailing
     *  edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // ensure `batchLog` is invoked once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }));
     *
     * // cancel a debounced call
     * var todoChanges = _.debounce(batchLog, 1000);
     * Object.observe(models.todo, todoChanges);
     *
     * Object.observe(models, function(changes) {
     *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
     *     todoChanges.cancel();
     *   }
     * }, ['delete']);
     *
     * // ...at some point `models.todo` is changed
     * models.todo.completed = true;
     *
     * // ...before 1 second has passed `models.todo` is deleted
     * // which cancels the debounced `todoChanges` call
     * delete models.todo;
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = wait < 0 ? 0 : (+wait || 0);
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }

      function cancel() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (maxTimeoutId) {
          clearTimeout(maxTimeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
      }

      function delayed() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0 || remaining > wait) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
            if (!timeoutId && !maxTimeoutId) {
              args = thisArg = null;
            }
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      }

      function maxDelayed() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || (maxWait !== wait)) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      }

      function debounced() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0 || remaining > maxWait;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
        return result;
      }
      debounced.cancel = cancel;
      return debounced;
    }

    /**
     * Defers invoking the `func` until the current call stack has cleared. Any
     * additional arguments are provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to defer.
     * @param {...*} [args] The arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) {
     *   console.log(text);
     * }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    var defer = restParam(function(func, args) {
      return baseDelay(func, 1, args);
    });

    /**
     * Invokes `func` after `wait` milliseconds. Any additional arguments are
     * provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay invocation.
     * @param {...*} [args] The arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) {
     *   console.log(text);
     * }, 1000, 'later');
     * // => logs 'later' after one second
     */
    var delay = restParam(function(func, wait, args) {
      return baseDelay(func, wait, args);
    });

    /**
     * Creates a function that returns the result of invoking the provided
     * functions with the `this` binding of the created function, where each
     * successive invocation is supplied the return value of the previous.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {...Function} [funcs] Functions to invoke.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var addSquare = _.flow(_.add, square);
     * addSquare(1, 2);
     * // => 9
     */
    var flow = createFlow();

    /**
     * This method is like `_.flow` except that it creates a function that
     * invokes the provided functions from right to left.
     *
     * @static
     * @memberOf _
     * @alias backflow, compose
     * @category Function
     * @param {...Function} [funcs] Functions to invoke.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var addSquare = _.flowRight(square, _.add);
     * addSquare(1, 2);
     * // => 9
     */
    var flowRight = createFlow(true);

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it determines the cache key for storing the result based on the
     * arguments provided to the memoized function. By default, the first argument
     * provided to the memoized function is coerced to a string and used as the
     * cache key. The `func` is invoked with the `this` binding of the memoized
     * function.
     *
     * **Note:** The cache is exposed as the `cache` property on the memoized
     * function. Its creation may be customized by replacing the `_.memoize.Cache`
     * constructor with one whose instances implement the [`Map`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-properties-of-the-map-prototype-object)
     * method interface of `get`, `has`, and `set`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] The function to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var upperCase = _.memoize(function(string) {
     *   return string.toUpperCase();
     * });
     *
     * upperCase('fred');
     * // => 'FRED'
     *
     * // modifying the result cache
     * upperCase.cache.set('fred', 'BARNEY');
     * upperCase('fred');
     * // => 'BARNEY'
     *
     * // replacing `_.memoize.Cache`
     * var object = { 'user': 'fred' };
     * var other = { 'user': 'barney' };
     * var identity = _.memoize(_.identity);
     *
     * identity(object);
     * // => { 'user': 'fred' }
     * identity(other);
     * // => { 'user': 'fred' }
     *
     * _.memoize.Cache = WeakMap;
     * var identity = _.memoize(_.identity);
     *
     * identity(object);
     * // => { 'user': 'fred' }
     * identity(other);
     * // => { 'user': 'barney' }
     */
    function memoize(func, resolver) {
      if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var memoized = function() {
        var args = arguments,
            cache = memoized.cache,
            key = resolver ? resolver.apply(this, args) : args[0];

        if (cache.has(key)) {
          return cache.get(key);
        }
        var result = func.apply(this, args);
        cache.set(key, result);
        return result;
      };
      memoized.cache = new memoize.Cache;
      return memoized;
    }

    /**
     * Creates a function that negates the result of the predicate `func`. The
     * `func` predicate is invoked with the `this` binding and arguments of the
     * created function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} predicate The predicate to negate.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function isEven(n) {
     *   return n % 2 == 0;
     * }
     *
     * _.filter([1, 2, 3, 4, 5, 6], _.negate(isEven));
     * // => [1, 3, 5]
     */
    function negate(predicate) {
      if (typeof predicate != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return function() {
        return !predicate.apply(this, arguments);
      };
    }

    /**
     * Creates a function that is restricted to invoking `func` once. Repeat calls
     * to the function return the value of the first call. The `func` is invoked
     * with the `this` binding and arguments of the created function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` invokes `createApplication` once
     */
    function once(func) {
      return before(2, func);
    }

    /**
     * Creates a function that invokes `func` with `partial` arguments prepended
     * to those provided to the new function. This method is like `_.bind` except
     * it does **not** alter the `this` binding.
     *
     * The `_.partial.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * **Note:** This method does not set the "length" property of partially
     * applied functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) {
     *   return greeting + ' ' + name;
     * };
     *
     * var sayHelloTo = _.partial(greet, 'hello');
     * sayHelloTo('fred');
     * // => 'hello fred'
     *
     * // using placeholders
     * var greetFred = _.partial(greet, _, 'fred');
     * greetFred('hi');
     * // => 'hi fred'
     */
    var partial = createPartial(PARTIAL_FLAG);

    /**
     * This method is like `_.partial` except that partially applied arguments
     * are appended to those provided to the new function.
     *
     * The `_.partialRight.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * **Note:** This method does not set the "length" property of partially
     * applied functions.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) {
     *   return greeting + ' ' + name;
     * };
     *
     * var greetFred = _.partialRight(greet, 'fred');
     * greetFred('hi');
     * // => 'hi fred'
     *
     * // using placeholders
     * var sayHelloTo = _.partialRight(greet, 'hello', _);
     * sayHelloTo('fred');
     * // => 'hello fred'
     */
    var partialRight = createPartial(PARTIAL_RIGHT_FLAG);

    /**
     * Creates a function that invokes `func` with arguments arranged according
     * to the specified indexes where the argument value at the first index is
     * provided as the first argument, the argument value at the second index is
     * provided as the second argument, and so on.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to rearrange arguments for.
     * @param {...(number|number[])} indexes The arranged argument indexes,
     *  specified as individual indexes or arrays of indexes.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var rearged = _.rearg(function(a, b, c) {
     *   return [a, b, c];
     * }, 2, 0, 1);
     *
     * rearged('b', 'c', 'a')
     * // => ['a', 'b', 'c']
     *
     * var map = _.rearg(_.map, [1, 0]);
     * map(function(n) {
     *   return n * 3;
     * }, [1, 2, 3]);
     * // => [3, 6, 9]
     */
    var rearg = restParam(function(func, indexes) {
      return createWrapper(func, REARG_FLAG, null, null, null, baseFlatten(indexes));
    });

    /**
     * Creates a function that invokes `func` with the `this` binding of the
     * created function and arguments from `start` and beyond provided as an array.
     *
     * **Note:** This method is based on the [rest parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters).
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var say = _.restParam(function(what, names) {
     *   return what + ' ' + _.initial(names).join(', ') +
     *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
     * });
     *
     * say('hello', 'fred', 'barney', 'pebbles');
     * // => 'hello fred, barney, & pebbles'
     */
    function restParam(func, start) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      start = nativeMax(start === undefined ? (func.length - 1) : (+start || 0), 0);
      return function() {
        var args = arguments,
            index = -1,
            length = nativeMax(args.length - start, 0),
            rest = Array(length);

        while (++index < length) {
          rest[index] = args[start + index];
        }
        switch (start) {
          case 0: return func.call(this, rest);
          case 1: return func.call(this, args[0], rest);
          case 2: return func.call(this, args[0], args[1], rest);
        }
        var otherArgs = Array(start + 1);
        index = -1;
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = rest;
        return func.apply(this, otherArgs);
      };
    }

    /**
     * Creates a function that invokes `func` with the `this` binding of the created
     * function and an array of arguments much like [`Function#apply`](https://es5.github.io/#x15.3.4.3).
     *
     * **Note:** This method is based on the [spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator).
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to spread arguments over.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var say = _.spread(function(who, what) {
     *   return who + ' says ' + what;
     * });
     *
     * say(['fred', 'hello']);
     * // => 'fred says hello'
     *
     * // with a Promise
     * var numbers = Promise.all([
     *   Promise.resolve(40),
     *   Promise.resolve(36)
     * ]);
     *
     * numbers.then(_.spread(function(x, y) {
     *   return x + y;
     * }));
     * // => a Promise of 76
     */
    function spread(func) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return function(array) {
        return func.apply(this, array);
      };
    }

    /**
     * Creates a function that only invokes `func` at most once per every `wait`
     * milliseconds. The created function comes with a `cancel` method to cancel
     * delayed invocations. Provide an options object to indicate that `func`
     * should be invoked on the leading and/or trailing edge of the `wait` timeout.
     * Subsequent calls to the throttled function return the result of the last
     * `func` call.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
     * for details over the differences between `_.throttle` and `_.debounce`.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {Function} func The function to throttle.
     * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify invoking on the leading
     *  edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify invoking on the trailing
     *  edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
     *
     * // invoke `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     *
     * // cancel a trailing throttled call
     * jQuery(window).on('popstate', throttled.cancel);
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? !!options.leading : leading;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = +wait;
      debounceOptions.trailing = trailing;
      return debounce(func, wait, debounceOptions);
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Any additional arguments provided to the function are
     * appended to those provided to the wrapper function. The wrapper is invoked
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Function
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('fred, barney, & pebbles');
     * // => '<p>fred, barney, &amp; pebbles</p>'
     */
    function wrap(value, wrapper) {
      wrapper = wrapper == null ? identity : wrapper;
      return createWrapper(wrapper, PARTIAL_FLAG, null, [value], []);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects are cloned,
     * otherwise they are assigned by reference. If `customizer` is provided it is
     * invoked to produce the cloned values. If `customizer` returns `undefined`
     * cloning is handled by the method instead. The `customizer` is bound to
     * `thisArg` and invoked with two argument; (value [, index|key, object]).
     *
     * **Note:** This method is loosely based on the
     * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
     * The enumerable properties of `arguments` objects and objects created by
     * constructors other than `Object` are cloned to plain `Object` objects. An
     * empty object is returned for uncloneable values such as functions, DOM nodes,
     * Maps, Sets, and WeakMaps.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @param {Function} [customizer] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * var shallow = _.clone(users);
     * shallow[0] === users[0];
     * // => true
     *
     * var deep = _.clone(users, true);
     * deep[0] === users[0];
     * // => false
     *
     * // using a customizer callback
     * var el = _.clone(document.body, function(value) {
     *   if (_.isElement(value)) {
     *     return value.cloneNode(false);
     *   }
     * });
     *
     * el === document.body
     * // => false
     * el.nodeName
     * // => BODY
     * el.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, customizer, thisArg) {
      if (isDeep && typeof isDeep != 'boolean' && isIterateeCall(value, isDeep, customizer)) {
        isDeep = false;
      }
      else if (typeof isDeep == 'function') {
        thisArg = customizer;
        customizer = isDeep;
        isDeep = false;
      }
      customizer = typeof customizer == 'function' && bindCallback(customizer, thisArg, 1);
      return baseClone(value, isDeep, customizer);
    }

    /**
     * Creates a deep clone of `value`. If `customizer` is provided it is invoked
     * to produce the cloned values. If `customizer` returns `undefined` cloning
     * is handled by the method instead. The `customizer` is bound to `thisArg`
     * and invoked with two argument; (value [, index|key, object]).
     *
     * **Note:** This method is loosely based on the
     * [structured clone algorithm](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm).
     * The enumerable properties of `arguments` objects and objects created by
     * constructors other than `Object` are cloned to plain `Object` objects. An
     * empty object is returned for uncloneable values such as functions, DOM nodes,
     * Maps, Sets, and WeakMaps.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to deep clone.
     * @param {Function} [customizer] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * var deep = _.cloneDeep(users);
     * deep[0] === users[0];
     * // => false
     *
     * // using a customizer callback
     * var el = _.cloneDeep(document.body, function(value) {
     *   if (_.isElement(value)) {
     *     return value.cloneNode(true);
     *   }
     * });
     *
     * el === document.body
     * // => false
     * el.nodeName
     * // => BODY
     * el.childNodes.length;
     * // => 20
     */
    function cloneDeep(value, customizer, thisArg) {
      customizer = typeof customizer == 'function' && bindCallback(customizer, thisArg, 1);
      return baseClone(value, true, customizer);
    }

    /**
     * Checks if `value` is classified as an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      var length = isObjectLike(value) ? value.length : undefined;
      return isLength(length) && objToString.call(value) == argsTag;
    }

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(function() { return arguments; }());
     * // => false
     */
    var isArray = nativeIsArray || function(value) {
      return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag;
    };

    /**
     * Checks if `value` is classified as a boolean primitive or object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isBoolean(false);
     * // => true
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false || (isObjectLike(value) && objToString.call(value) == boolTag);
    }

    /**
     * Checks if `value` is classified as a `Date` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     *
     * _.isDate('Mon April 23 2012');
     * // => false
     */
    function isDate(value) {
      return isObjectLike(value) && objToString.call(value) == dateTag;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     *
     * _.isElement('<body>');
     * // => false
     */
    function isElement(value) {
      return !!value && value.nodeType === 1 && isObjectLike(value) &&
        (objToString.call(value).indexOf('Element') > -1);
    }
    // Fallback for environments without DOM support.
    if (!support.dom) {
      isElement = function(value) {
        return !!value && value.nodeType === 1 && isObjectLike(value) && !isPlainObject(value);
      };
    }

    /**
     * Checks if `value` is empty. A value is considered empty unless it is an
     * `arguments` object, array, string, or jQuery-like collection with a length
     * greater than `0` or an object with own enumerable properties.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty(null);
     * // => true
     *
     * _.isEmpty(true);
     * // => true
     *
     * _.isEmpty(1);
     * // => true
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({ 'a': 1 });
     * // => false
     */
    function isEmpty(value) {
      if (value == null) {
        return true;
      }
      var length = getLength(value);
      if (isLength(length) && (isArray(value) || isString(value) || isArguments(value) ||
          (isObjectLike(value) && isFunction(value.splice)))) {
        return !length;
      }
      return !keys(value).length;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent. If `customizer` is provided it is invoked to compare values.
     * If `customizer` returns `undefined` comparisons are handled by the method
     * instead. The `customizer` is bound to `thisArg` and invoked with three
     * arguments: (value, other [, index|key]).
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. Functions and DOM nodes
     * are **not** supported. Provide a customizer function to extend support
     * for comparing other values.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {Function} [customizer] The function to customize value comparisons.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'user': 'fred' };
     * var other = { 'user': 'fred' };
     *
     * object == other;
     * // => false
     *
     * _.isEqual(object, other);
     * // => true
     *
     * // using a customizer callback
     * var array = ['hello', 'goodbye'];
     * var other = ['hi', 'goodbye'];
     *
     * _.isEqual(array, other, function(value, other) {
     *   if (_.every([value, other], RegExp.prototype.test, /^h(?:i|ello)$/)) {
     *     return true;
     *   }
     * });
     * // => true
     */
    function isEqual(value, other, customizer, thisArg) {
      customizer = typeof customizer == 'function' && bindCallback(customizer, thisArg, 3);
      if (!customizer && isStrictComparable(value) && isStrictComparable(other)) {
        return value === other;
      }
      var result = customizer ? customizer(value, other) : undefined;
      return result === undefined ? baseIsEqual(value, other, customizer) : !!result;
    }

    /**
     * Checks if `value` is an `Error`, `EvalError`, `RangeError`, `ReferenceError`,
     * `SyntaxError`, `TypeError`, or `URIError` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an error object, else `false`.
     * @example
     *
     * _.isError(new Error);
     * // => true
     *
     * _.isError(Error);
     * // => false
     */
    function isError(value) {
      return isObjectLike(value) && typeof value.message == 'string' && objToString.call(value) == errorTag;
    }

    /**
     * Checks if `value` is a finite primitive number.
     *
     * **Note:** This method is based on [`Number.isFinite`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.isfinite).
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a finite number, else `false`.
     * @example
     *
     * _.isFinite(10);
     * // => true
     *
     * _.isFinite('10');
     * // => false
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite(Object(10));
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    var isFinite = nativeNumIsFinite || function(value) {
      return typeof value == 'number' && nativeIsFinite(value);
    };

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    var isFunction = !(baseIsFunction(/x/) || (Uint8Array && !baseIsFunction(Uint8Array))) ? baseIsFunction : function(value) {
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in older versions of Chrome and Safari which return 'function' for regexes
      // and Safari 8 equivalents which return 'object' for typed array constructors.
      return objToString.call(value) == funcTag;
    };

    /**
     * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // Avoid a V8 JIT bug in Chrome 19-20.
      // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
      var type = typeof value;
      return type == 'function' || (!!value && type == 'object');
    }

    /**
     * Performs a deep comparison between `object` and `source` to determine if
     * `object` contains equivalent property values. If `customizer` is provided
     * it is invoked to compare values. If `customizer` returns `undefined`
     * comparisons are handled by the method instead. The `customizer` is bound
     * to `thisArg` and invoked with three arguments: (value, other, index|key).
     *
     * **Note:** This method supports comparing properties of arrays, booleans,
     * `Date` objects, numbers, `Object` objects, regexes, and strings. Functions
     * and DOM nodes are **not** supported. Provide a customizer function to extend
     * support for comparing other values.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {Object} object The object to inspect.
     * @param {Object} source The object of property values to match.
     * @param {Function} [customizer] The function to customize value comparisons.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     * @example
     *
     * var object = { 'user': 'fred', 'age': 40 };
     *
     * _.isMatch(object, { 'age': 40 });
     * // => true
     *
     * _.isMatch(object, { 'age': 36 });
     * // => false
     *
     * // using a customizer callback
     * var object = { 'greeting': 'hello' };
     * var source = { 'greeting': 'hi' };
     *
     * _.isMatch(object, source, function(value, other) {
     *   return _.every([value, other], RegExp.prototype.test, /^h(?:i|ello)$/) || undefined;
     * });
     * // => true
     */
    function isMatch(object, source, customizer, thisArg) {
      var props = keys(source),
          length = props.length;

      if (!length) {
        return true;
      }
      if (object == null) {
        return false;
      }
      customizer = typeof customizer == 'function' && bindCallback(customizer, thisArg, 3);
      object = toObject(object);
      if (!customizer && length == 1) {
        var key = props[0],
            value = source[key];

        if (isStrictComparable(value)) {
          return value === object[key] && (value !== undefined || (key in object));
        }
      }
      var values = Array(length),
          strictCompareFlags = Array(length);

      while (length--) {
        value = values[length] = source[props[length]];
        strictCompareFlags[length] = isStrictComparable(value);
      }
      return baseIsMatch(object, props, values, strictCompareFlags, customizer);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * **Note:** This method is not the same as [`isNaN`](https://es5.github.io/#x15.1.2.4)
     * which returns `true` for `undefined` and other non-numeric values.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // An `NaN` primitive is the only value that is not equal to itself.
      // Perform the `toStringTag` check first to avoid errors with some host objects in IE.
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function, else `false`.
     * @example
     *
     * _.isNative(Array.prototype.push);
     * // => true
     *
     * _.isNative(_);
     * // => false
     */
    function isNative(value) {
      if (value == null) {
        return false;
      }
      if (objToString.call(value) == funcTag) {
        return reIsNative.test(fnToString.call(value));
      }
      return isObjectLike(value) && reIsHostCtor.test(value);
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(void 0);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is classified as a `Number` primitive or object.
     *
     * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are classified
     * as numbers, use the `_.isFinite` method.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isNumber(8.4);
     * // => true
     *
     * _.isNumber(NaN);
     * // => true
     *
     * _.isNumber('8.4');
     * // => false
     */
    function isNumber(value) {
      return typeof value == 'number' || (isObjectLike(value) && objToString.call(value) == numberTag);
    }

    /**
     * Checks if `value` is a plain object, that is, an object created by the
     * `Object` constructor or one with a `[[Prototype]]` of `null`.
     *
     * **Note:** This method assumes objects created by the `Object` constructor
     * have no inherited enumerable properties.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     * }
     *
     * _.isPlainObject(new Foo);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     *
     * _.isPlainObject(Object.create(null));
     * // => true
     */
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
      if (!(value && objToString.call(value) == objectTag)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto
        ? (value == objProto || getPrototypeOf(value) == objProto)
        : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is classified as a `RegExp` object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isRegExp(/abc/);
     * // => true
     *
     * _.isRegExp('/abc/');
     * // => false
     */
    function isRegExp(value) {
      return (isObjectLike(value) && objToString.call(value) == regexpTag) || false;
    }

    /**
     * Checks if `value` is classified as a `String` primitive or object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isString('abc');
     * // => true
     *
     * _.isString(1);
     * // => false
     */
    function isString(value) {
      return typeof value == 'string' || (isObjectLike(value) && objToString.call(value) == stringTag);
    }

    /**
     * Checks if `value` is classified as a typed array.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
     * @example
     *
     * _.isTypedArray(new Uint8Array);
     * // => true
     *
     * _.isTypedArray([]);
     * // => false
     */
    function isTypedArray(value) {
      return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objToString.call(value)];
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     *
     * _.isUndefined(null);
     * // => false
     */
    function isUndefined(value) {
      return value === undefined;
    }

    /**
     * Converts `value` to an array.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {Array} Returns the converted array.
     * @example
     *
     * (function() {
     *   return _.toArray(arguments).slice(1);
     * }(1, 2, 3));
     * // => [2, 3]
     */
    function toArray(value) {
      var length = value ? getLength(value) : 0;
      if (!isLength(length)) {
        return values(value);
      }
      if (!length) {
        return [];
      }
      return arrayCopy(value);
    }

    /**
     * Converts `value` to a plain object flattening inherited enumerable
     * properties of `value` to own properties of the plain object.
     *
     * @static
     * @memberOf _
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {Object} Returns the converted plain object.
     * @example
     *
     * function Foo() {
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.assign({ 'a': 1 }, new Foo);
     * // => { 'a': 1, 'b': 2 }
     *
     * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
     * // => { 'a': 1, 'b': 2, 'c': 3 }
     */
    function toPlainObject(value) {
      return baseCopy(value, keysIn(value));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources overwrite property assignments of previous sources.
     * If `customizer` is provided it is invoked to produce the assigned values.
     * The `customizer` is bound to `thisArg` and invoked with five arguments:
     * (objectValue, sourceValue, key, object, source).
     *
     * **Note:** This method mutates `object` and is based on
     * [`Object.assign`](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.assign).
     *
     *
     * @static
     * @memberOf _
     * @alias extend
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @param {Function} [customizer] The function to customize assigned values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.assign({ 'user': 'barney' }, { 'age': 40 }, { 'user': 'fred' });
     * // => { 'user': 'fred', 'age': 40 }
     *
     * // using a customizer callback
     * var defaults = _.partialRight(_.assign, function(value, other) {
     *   return _.isUndefined(value) ? other : value;
     * });
     *
     * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
     * // => { 'user': 'barney', 'age': 36 }
     */
    var assign = createAssigner(function(object, source, customizer) {
      return customizer
        ? assignWith(object, source, customizer)
        : baseAssign(object, source);
    });

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, {
     *   'constructor': Circle
     * });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties, guard) {
      var result = baseCreate(prototype);
      if (guard && isIterateeCall(prototype, properties, guard)) {
        properties = null;
      }
      return properties ? baseAssign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional values of the same property are ignored.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred' });
     * // => { 'user': 'barney', 'age': 36 }
     */
    var defaults = restParam(function(args) {
      var object = args[0];
      if (object == null) {
        return object;
      }
      args.push(assignDefaults);
      return assign.apply(undefined, args);
    });

    /**
     * This method is like `_.find` except that it returns the key of the first
     * element `predicate` returns truthy for instead of the element itself.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {string|undefined} Returns the key of the matched element, else `undefined`.
     * @example
     *
     * var users = {
     *   'barney':  { 'age': 36, 'active': true },
     *   'fred':    { 'age': 40, 'active': false },
     *   'pebbles': { 'age': 1,  'active': true }
     * };
     *
     * _.findKey(users, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (iteration order is not guaranteed)
     *
     * // using the `_.matches` callback shorthand
     * _.findKey(users, { 'age': 1, 'active': true });
     * // => 'pebbles'
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findKey(users, 'active', false);
     * // => 'fred'
     *
     * // using the `_.property` callback shorthand
     * _.findKey(users, 'active');
     * // => 'barney'
     */
    var findKey = createFindKey(baseForOwn);

    /**
     * This method is like `_.findKey` except that it iterates over elements of
     * a collection in the opposite order.
     *
     * If a property name is provided for `predicate` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `predicate` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [predicate=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {string|undefined} Returns the key of the matched element, else `undefined`.
     * @example
     *
     * var users = {
     *   'barney':  { 'age': 36, 'active': true },
     *   'fred':    { 'age': 40, 'active': false },
     *   'pebbles': { 'age': 1,  'active': true }
     * };
     *
     * _.findLastKey(users, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles` assuming `_.findKey` returns `barney`
     *
     * // using the `_.matches` callback shorthand
     * _.findLastKey(users, { 'age': 36, 'active': true });
     * // => 'barney'
     *
     * // using the `_.matchesProperty` callback shorthand
     * _.findLastKey(users, 'active', false);
     * // => 'fred'
     *
     * // using the `_.property` callback shorthand
     * _.findLastKey(users, 'active');
     * // => 'pebbles'
     */
    var findLastKey = createFindKey(baseForOwnRight);

    /**
     * Iterates over own and inherited enumerable properties of an object invoking
     * `iteratee` for each property. The `iteratee` is bound to `thisArg` and invoked
     * with three arguments: (value, key, object). Iteratee functions may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forIn(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'a', 'b', and 'c' (iteration order is not guaranteed)
     */
    var forIn = createForIn(baseFor);

    /**
     * This method is like `_.forIn` except that it iterates over properties of
     * `object` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forInRight(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'c', 'b', and 'a' assuming `_.forIn ` logs 'a', 'b', and 'c'
     */
    var forInRight = createForIn(baseForRight);

    /**
     * Iterates over own enumerable properties of an object invoking `iteratee`
     * for each property. The `iteratee` is bound to `thisArg` and invoked with
     * three arguments: (value, key, object). Iteratee functions may exit iteration
     * early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forOwn(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'a' and 'b' (iteration order is not guaranteed)
     */
    var forOwn = createForOwn(baseForOwn);

    /**
     * This method is like `_.forOwn` except that it iterates over properties of
     * `object` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forOwnRight(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'b' and 'a' assuming `_.forOwn` logs 'a' and 'b'
     */
    var forOwnRight = createForOwn(baseForOwnRight);

    /**
     * Creates an array of function property names from all enumerable properties,
     * own and inherited, of `object`.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Object
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns the new array of property names.
     * @example
     *
     * _.functions(_);
     * // => ['after', 'ary', 'assign', ...]
     */
    function functions(object) {
      return baseFunctions(object, keysIn(object));
    }

    /**
     * Gets the property value of `path` on `object`. If the resolved value is
     * `undefined` the `defaultValue` is used in its place.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to get.
     * @param {*} [defaultValue] The value returned if the resolved value is `undefined`.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.get(object, 'a[0].b.c');
     * // => 3
     *
     * _.get(object, ['a', '0', 'b', 'c']);
     * // => 3
     *
     * _.get(object, 'a.b.c', 'default');
     * // => 'default'
     */
    function get(object, path, defaultValue) {
      var result = object == null ? undefined : baseGet(object, toPath(path), path + '');
      return result === undefined ? defaultValue : result;
    }

    /**
     * Checks if `path` is a direct property.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path to check.
     * @returns {boolean} Returns `true` if `path` is a direct property, else `false`.
     * @example
     *
     * var object = { 'a': { 'b': { 'c': 3 } } };
     *
     * _.has(object, 'a');
     * // => true
     *
     * _.has(object, 'a.b.c');
     * // => true
     *
     * _.has(object, ['a', 'b', 'c']);
     * // => true
     */
    function has(object, path) {
      if (object == null) {
        return false;
      }
      var result = hasOwnProperty.call(object, path);
      if (!result && !isKey(path)) {
        path = toPath(path);
        object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
        path = last(path);
        result = object != null && hasOwnProperty.call(object, path);
      }
      return result;
    }

    /**
     * Creates an object composed of the inverted keys and values of `object`.
     * If `object` contains duplicate values, subsequent values overwrite property
     * assignments of previous values unless `multiValue` is `true`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to invert.
     * @param {boolean} [multiValue] Allow multiple values per key.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Object} Returns the new inverted object.
     * @example
     *
     * var object = { 'a': 1, 'b': 2, 'c': 1 };
     *
     * _.invert(object);
     * // => { '1': 'c', '2': 'b' }
     *
     * // with `multiValue`
     * _.invert(object, true);
     * // => { '1': ['a', 'c'], '2': ['b'] }
     */
    function invert(object, multiValue, guard) {
      if (guard && isIterateeCall(object, multiValue, guard)) {
        multiValue = null;
      }
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index],
            value = object[key];

        if (multiValue) {
          if (hasOwnProperty.call(result, value)) {
            result[value].push(key);
          } else {
            result[value] = [key];
          }
        }
        else {
          result[value] = key;
        }
      }
      return result;
    }

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.keys)
     * for more details.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      if (object) {
        var Ctor = object.constructor,
            length = object.length;
      }
      if ((typeof Ctor == 'function' && Ctor.prototype === object) ||
          (typeof object != 'function' && isLength(length))) {
        return shimKeys(object);
      }
      return isObject(object) ? nativeKeys(object) : [];
    };

    /**
     * Creates an array of the own and inherited enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keysIn(new Foo);
     * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
     */
    function keysIn(object) {
      if (object == null) {
        return [];
      }
      if (!isObject(object)) {
        object = Object(object);
      }
      var length = object.length;
      length = (length && isLength(length) &&
        (isArray(object) || (support.nonEnumArgs && isArguments(object))) && length) || 0;

      var Ctor = object.constructor,
          index = -1,
          isProto = typeof Ctor == 'function' && Ctor.prototype === object,
          result = Array(length),
          skipIndexes = length > 0;

      while (++index < length) {
        result[index] = (index + '');
      }
      for (var key in object) {
        if (!(skipIndexes && isIndex(key, length)) &&
            !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through `iteratee`. The
     * iteratee function is bound to `thisArg` and invoked with three arguments:
     * (value, key, object).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked
     *  per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Object} Returns the new mapped object.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2 }, function(n) {
     *   return n * 3;
     * });
     * // => { 'a': 3, 'b': 6 }
     *
     * var users = {
     *   'fred':    { 'user': 'fred',    'age': 40 },
     *   'pebbles': { 'user': 'pebbles', 'age': 1 }
     * };
     *
     * // using the `_.property` callback shorthand
     * _.mapValues(users, 'age');
     * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
     */
    function mapValues(object, iteratee, thisArg) {
      var result = {};
      iteratee = getCallback(iteratee, thisArg, 3);

      baseForOwn(object, function(value, key, object) {
        result[key] = iteratee(value, key, object);
      });
      return result;
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * overwrite property assignments of previous sources. If `customizer` is
     * provided it is invoked to produce the merged values of the destination and
     * source properties. If `customizer` returns `undefined` merging is handled
     * by the method instead. The `customizer` is bound to `thisArg` and invoked
     * with five arguments: (objectValue, sourceValue, key, object, source).
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @param {Function} [customizer] The function to customize assigned values.
     * @param {*} [thisArg] The `this` binding of `customizer`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var users = {
     *   'data': [{ 'user': 'barney' }, { 'user': 'fred' }]
     * };
     *
     * var ages = {
     *   'data': [{ 'age': 36 }, { 'age': 40 }]
     * };
     *
     * _.merge(users, ages);
     * // => { 'data': [{ 'user': 'barney', 'age': 36 }, { 'user': 'fred', 'age': 40 }] }
     *
     * // using a customizer callback
     * var object = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var other = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(object, other, function(a, b) {
     *   if (_.isArray(a)) {
     *     return a.concat(b);
     *   }
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot'] }
     */
    var merge = createAssigner(baseMerge);

    /**
     * The opposite of `_.pick`; this method creates an object composed of the
     * own and inherited enumerable properties of `object` that are not omitted.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If `predicate` is provided it is invoked for each property
     * of `object` omitting the properties `predicate` returns truthy for. The
     * predicate is bound to `thisArg` and invoked with three arguments:
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The source object.
     * @param {Function|...(string|string[])} [predicate] The function invoked per
     *  iteration or property names to omit, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Object} Returns the new object.
     * @example
     *
     * var object = { 'user': 'fred', 'age': 40 };
     *
     * _.omit(object, 'age');
     * // => { 'user': 'fred' }
     *
     * _.omit(object, _.isNumber);
     * // => { 'user': 'fred' }
     */
    var omit = restParam(function(object, props) {
      if (object == null) {
        return {};
      }
      if (typeof props[0] != 'function') {
        var props = arrayMap(baseFlatten(props), String);
        return pickByArray(object, baseDifference(keysIn(object), props));
      }
      var predicate = bindCallback(props[0], props[1], 3);
      return pickByCallback(object, function(value, key, object) {
        return !predicate(value, key, object);
      });
    });

    /**
     * Creates a two dimensional array of the key-value pairs for `object`,
     * e.g. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates an object composed of the picked `object` properties. Property
     * names may be specified as individual arguments or as arrays of property
     * names. If `predicate` is provided it is invoked for each property of `object`
     * picking the properties `predicate` returns truthy for. The predicate is
     * bound to `thisArg` and invoked with three arguments: (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The source object.
     * @param {Function|...(string|string[])} [predicate] The function invoked per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `predicate`.
     * @returns {Object} Returns the new object.
     * @example
     *
     * var object = { 'user': 'fred', 'age': 40 };
     *
     * _.pick(object, 'user');
     * // => { 'user': 'fred' }
     *
     * _.pick(object, _.isString);
     * // => { 'user': 'fred' }
     */
    var pick = restParam(function(object, props) {
      if (object == null) {
        return {};
      }
      return typeof props[0] == 'function'
        ? pickByCallback(object, bindCallback(props[0], props[1], 3))
        : pickByArray(object, baseFlatten(props));
    });

    /**
     * This method is like `_.get` except that if the resolved value is a function
     * it is invoked with the `this` binding of its parent object and its result
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to resolve.
     * @param {*} [defaultValue] The value returned if the resolved value is `undefined`.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c1': 3, 'c2': _.constant(4) } }] };
     *
     * _.result(object, 'a[0].b.c1');
     * // => 3
     *
     * _.result(object, 'a[0].b.c2');
     * // => 4
     *
     * _.result(object, 'a.b.c', 'default');
     * // => 'default'
     *
     * _.result(object, 'a.b.c', _.constant('default'));
     * // => 'default'
     */
    function result(object, path, defaultValue) {
      var result = object == null ? undefined : object[path];
      if (result === undefined) {
        if (object != null && !isKey(path, object)) {
          path = toPath(path);
          object = path.length == 1 ? object : baseGet(object, baseSlice(path, 0, -1));
          result = object == null ? undefined : object[last(path)];
        }
        result = result === undefined ? defaultValue : result;
      }
      return isFunction(result) ? result.call(object) : result;
    }

    /**
     * Sets the property value of `path` on `object`. If a portion of `path`
     * does not exist it is created.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to augment.
     * @param {Array|string} path The path of the property to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.set(object, 'a[0].b.c', 4);
     * console.log(object.a[0].b.c);
     * // => 4
     *
     * _.set(object, 'x[0].y.z', 5);
     * console.log(object.x[0].y.z);
     * // => 5
     */
    function set(object, path, value) {
      if (object == null) {
        return object;
      }
      var pathKey = (path + '');
      path = (object[pathKey] != null || isKey(path, object)) ? [pathKey] : toPath(path);

      var index = -1,
          length = path.length,
          endIndex = length - 1,
          nested = object;

      while (nested != null && ++index < length) {
        var key = path[index];
        if (isObject(nested)) {
          if (index == endIndex) {
            nested[key] = value;
          } else if (nested[key] == null) {
            nested[key] = isIndex(path[index + 1]) ? [] : {};
          }
        }
        nested = nested[key];
      }
      return object;
    }

    /**
     * An alternative to `_.reduce`; this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own enumerable
     * properties through `iteratee`, with each invocation potentially mutating
     * the `accumulator` object. The `iteratee` is bound to `thisArg` and invoked
     * with four arguments: (accumulator, value, key, object). Iteratee functions
     * may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * _.transform([2, 3, 4], function(result, n) {
     *   result.push(n *= n);
     *   return n % 2 == 0;
     * });
     * // => [4, 9]
     *
     * _.transform({ 'a': 1, 'b': 2 }, function(result, n, key) {
     *   result[key] = n * 3;
     * });
     * // => { 'a': 3, 'b': 6 }
     */
    function transform(object, iteratee, accumulator, thisArg) {
      var isArr = isArray(object) || isTypedArray(object);
      iteratee = getCallback(iteratee, thisArg, 4);

      if (accumulator == null) {
        if (isArr || isObject(object)) {
          var Ctor = object.constructor;
          if (isArr) {
            accumulator = isArray(object) ? new Ctor : [];
          } else {
            accumulator = baseCreate(isFunction(Ctor) && Ctor.prototype);
          }
        } else {
          accumulator = {};
        }
      }
      (isArr ? arrayEach : baseForOwn)(object, function(value, index, object) {
        return iteratee(accumulator, value, index, object);
      });
      return accumulator;
    }

    /**
     * Creates an array of the own enumerable property values of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property values.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.values(new Foo);
     * // => [1, 2] (iteration order is not guaranteed)
     *
     * _.values('hi');
     * // => ['h', 'i']
     */
    function values(object) {
      return baseValues(object, keys(object));
    }

    /**
     * Creates an array of the own and inherited enumerable property values
     * of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property values.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.valuesIn(new Foo);
     * // => [1, 2, 3] (iteration order is not guaranteed)
     */
    function valuesIn(object) {
      return baseValues(object, keysIn(object));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Checks if `n` is between `start` and up to but not including, `end`. If
     * `end` is not specified it is set to `start` with `start` then set to `0`.
     *
     * @static
     * @memberOf _
     * @category Number
     * @param {number} n The number to check.
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @returns {boolean} Returns `true` if `n` is in the range, else `false`.
     * @example
     *
     * _.inRange(3, 2, 4);
     * // => true
     *
     * _.inRange(4, 8);
     * // => true
     *
     * _.inRange(4, 2);
     * // => false
     *
     * _.inRange(2, 2);
     * // => false
     *
     * _.inRange(1.2, 2);
     * // => true
     *
     * _.inRange(5.2, 4);
     * // => false
     */
    function inRange(value, start, end) {
      start = +start || 0;
      if (typeof end === 'undefined') {
        end = start;
        start = 0;
      } else {
        end = +end || 0;
      }
      return value >= nativeMin(start, end) && value < nativeMax(start, end);
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number is returned.
     * If `floating` is `true`, or either `min` or `max` are floats, a floating-point
     * number is returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Number
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating] Specify returning a floating-point number.
     * @returns {number} Returns the random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      if (floating && isIterateeCall(min, max, floating)) {
        max = floating = null;
      }
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (noMax && typeof min == 'boolean') {
          floating = min;
          min = 1;
        }
        else if (typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
        noMax = false;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand + '').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Converts `string` to [camel case](https://en.wikipedia.org/wiki/CamelCase).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the camel cased string.
     * @example
     *
     * _.camelCase('Foo Bar');
     * // => 'fooBar'
     *
     * _.camelCase('--foo-bar');
     * // => 'fooBar'
     *
     * _.camelCase('__foo_bar__');
     * // => 'fooBar'
     */
    var camelCase = createCompounder(function(result, word, index) {
      word = word.toLowerCase();
      return result + (index ? (word.charAt(0).toUpperCase() + word.slice(1)) : word);
    });

    /**
     * Capitalizes the first character of `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to capitalize.
     * @returns {string} Returns the capitalized string.
     * @example
     *
     * _.capitalize('fred');
     * // => 'Fred'
     */
    function capitalize(string) {
      string = baseToString(string);
      return string && (string.charAt(0).toUpperCase() + string.slice(1));
    }

    /**
     * Deburrs `string` by converting [latin-1 supplementary letters](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
     * to basic latin letters and removing [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to deburr.
     * @returns {string} Returns the deburred string.
     * @example
     *
     * _.deburr('déjà vu');
     * // => 'deja vu'
     */
    function deburr(string) {
      string = baseToString(string);
      return string && string.replace(reLatin1, deburrLetter).replace(reComboMark, '');
    }

    /**
     * Checks if `string` ends with the given target string.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to search.
     * @param {string} [target] The string to search for.
     * @param {number} [position=string.length] The position to search from.
     * @returns {boolean} Returns `true` if `string` ends with `target`, else `false`.
     * @example
     *
     * _.endsWith('abc', 'c');
     * // => true
     *
     * _.endsWith('abc', 'b');
     * // => false
     *
     * _.endsWith('abc', 'b', 2);
     * // => true
     */
    function endsWith(string, target, position) {
      string = baseToString(string);
      target = (target + '');

      var length = string.length;
      position = position === undefined
        ? length
        : nativeMin(position < 0 ? 0 : (+position || 0), length);

      position -= target.length;
      return position >= 0 && string.indexOf(target, position) == position;
    }

    /**
     * Converts the characters "&", "<", ">", '"', "'", and "\`", in `string` to
     * their corresponding HTML entities.
     *
     * **Note:** No other characters are escaped. To escape additional characters
     * use a third-party library like [_he_](https://mths.be/he).
     *
     * Though the ">" character is escaped for symmetry, characters like
     * ">" and "/" don't require escaping in HTML and have no special meaning
     * unless they're part of a tag or unquoted attribute value.
     * See [Mathias Bynens's article](https://mathiasbynens.be/notes/ambiguous-ampersands)
     * (under "semi-related fun fact") for more details.
     *
     * Backticks are escaped because in Internet Explorer < 9, they can break out
     * of attribute values or HTML comments. See [#59](https://html5sec.org/#59),
     * [#102](https://html5sec.org/#102), [#108](https://html5sec.org/#108), and
     * [#133](https://html5sec.org/#133) of the [HTML5 Security Cheatsheet](https://html5sec.org/)
     * for more details.
     *
     * When working with HTML you should always [quote attribute values](http://wonko.com/post/html-escaping)
     * to reduce XSS vectors.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('fred, barney, & pebbles');
     * // => 'fred, barney, &amp; pebbles'
     */
    function escape(string) {
      // Reset `lastIndex` because in IE < 9 `String#replace` does not.
      string = baseToString(string);
      return (string && reHasUnescapedHtml.test(string))
        ? string.replace(reUnescapedHtml, escapeHtmlChar)
        : string;
    }

    /**
     * Escapes the `RegExp` special characters "\", "/", "^", "$", ".", "|", "?",
     * "*", "+", "(", ")", "[", "]", "{" and "}" in `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escapeRegExp('[lodash](https://lodash.com/)');
     * // => '\[lodash\]\(https:\/\/lodash\.com\/\)'
     */
    function escapeRegExp(string) {
      string = baseToString(string);
      return (string && reHasRegExpChars.test(string))
        ? string.replace(reRegExpChars, '\\$&')
        : string;
    }

    /**
     * Converts `string` to [kebab case](https://en.wikipedia.org/wiki/Letter_case#Special_case_styles).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the kebab cased string.
     * @example
     *
     * _.kebabCase('Foo Bar');
     * // => 'foo-bar'
     *
     * _.kebabCase('fooBar');
     * // => 'foo-bar'
     *
     * _.kebabCase('__foo_bar__');
     * // => 'foo-bar'
     */
    var kebabCase = createCompounder(function(result, word, index) {
      return result + (index ? '-' : '') + word.toLowerCase();
    });

    /**
     * Pads `string` on the left and right sides if it is shorter than `length`.
     * Padding characters are truncated if they can't be evenly divided by `length`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.pad('abc', 8);
     * // => '  abc   '
     *
     * _.pad('abc', 8, '_-');
     * // => '_-abc_-_'
     *
     * _.pad('abc', 3);
     * // => 'abc'
     */
    function pad(string, length, chars) {
      string = baseToString(string);
      length = +length;

      var strLength = string.length;
      if (strLength >= length || !nativeIsFinite(length)) {
        return string;
      }
      var mid = (length - strLength) / 2,
          leftLength = floor(mid),
          rightLength = ceil(mid);

      chars = createPadding('', rightLength, chars);
      return chars.slice(0, leftLength) + string + chars;
    }

    /**
     * Pads `string` on the left side if it is shorter than `length`. Padding
     * characters are truncated if they exceed `length`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.padLeft('abc', 6);
     * // => '   abc'
     *
     * _.padLeft('abc', 6, '_-');
     * // => '_-_abc'
     *
     * _.padLeft('abc', 3);
     * // => 'abc'
     */
    var padLeft = createPadDir();

    /**
     * Pads `string` on the right side if it is shorter than `length`. Padding
     * characters are truncated if they exceed `length`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.padRight('abc', 6);
     * // => 'abc   '
     *
     * _.padRight('abc', 6, '_-');
     * // => 'abc_-_'
     *
     * _.padRight('abc', 3);
     * // => 'abc'
     */
    var padRight = createPadDir(true);

    /**
     * Converts `string` to an integer of the specified radix. If `radix` is
     * `undefined` or `0`, a `radix` of `10` is used unless `value` is a hexadecimal,
     * in which case a `radix` of `16` is used.
     *
     * **Note:** This method aligns with the [ES5 implementation](https://es5.github.io/#E)
     * of `parseInt`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} string The string to convert.
     * @param {number} [radix] The radix to interpret `value` by.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {number} Returns the converted integer.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     *
     * _.map(['6', '08', '10'], _.parseInt);
     * // => [6, 8, 10]
     */
    function parseInt(string, radix, guard) {
      if (guard && isIterateeCall(string, radix, guard)) {
        radix = 0;
      }
      return nativeParseInt(string, radix);
    }
    // Fallback for environments with pre-ES5 implementations.
    if (nativeParseInt(whitespace + '08') != 8) {
      parseInt = function(string, radix, guard) {
        // Firefox < 21 and Opera < 15 follow ES3 for `parseInt`.
        // Chrome fails to trim leading <BOM> whitespace characters.
        // See https://code.google.com/p/v8/issues/detail?id=3109 for more details.
        if (guard ? isIterateeCall(string, radix, guard) : radix == null) {
          radix = 0;
        } else if (radix) {
          radix = +radix;
        }
        string = trim(string);
        return nativeParseInt(string, radix || (reHasHexPrefix.test(string) ? 16 : 10));
      };
    }

    /**
     * Repeats the given string `n` times.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to repeat.
     * @param {number} [n=0] The number of times to repeat the string.
     * @returns {string} Returns the repeated string.
     * @example
     *
     * _.repeat('*', 3);
     * // => '***'
     *
     * _.repeat('abc', 2);
     * // => 'abcabc'
     *
     * _.repeat('abc', 0);
     * // => ''
     */
    function repeat(string, n) {
      var result = '';
      string = baseToString(string);
      n = +n;
      if (n < 1 || !string || !nativeIsFinite(n)) {
        return result;
      }
      // Leverage the exponentiation by squaring algorithm for a faster repeat.
      // See https://en.wikipedia.org/wiki/Exponentiation_by_squaring for more details.
      do {
        if (n % 2) {
          result += string;
        }
        n = floor(n / 2);
        string += string;
      } while (n);

      return result;
    }

    /**
     * Converts `string` to [snake case](https://en.wikipedia.org/wiki/Snake_case).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the snake cased string.
     * @example
     *
     * _.snakeCase('Foo Bar');
     * // => 'foo_bar'
     *
     * _.snakeCase('fooBar');
     * // => 'foo_bar'
     *
     * _.snakeCase('--foo-bar');
     * // => 'foo_bar'
     */
    var snakeCase = createCompounder(function(result, word, index) {
      return result + (index ? '_' : '') + word.toLowerCase();
    });

    /**
     * Converts `string` to [start case](https://en.wikipedia.org/wiki/Letter_case#Stylistic_or_specialised_usage).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the start cased string.
     * @example
     *
     * _.startCase('--foo-bar');
     * // => 'Foo Bar'
     *
     * _.startCase('fooBar');
     * // => 'Foo Bar'
     *
     * _.startCase('__foo_bar__');
     * // => 'Foo Bar'
     */
    var startCase = createCompounder(function(result, word, index) {
      return result + (index ? ' ' : '') + (word.charAt(0).toUpperCase() + word.slice(1));
    });

    /**
     * Checks if `string` starts with the given target string.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to search.
     * @param {string} [target] The string to search for.
     * @param {number} [position=0] The position to search from.
     * @returns {boolean} Returns `true` if `string` starts with `target`, else `false`.
     * @example
     *
     * _.startsWith('abc', 'a');
     * // => true
     *
     * _.startsWith('abc', 'b');
     * // => false
     *
     * _.startsWith('abc', 'b', 1);
     * // => true
     */
    function startsWith(string, target, position) {
      string = baseToString(string);
      position = position == null
        ? 0
        : nativeMin(position < 0 ? 0 : (+position || 0), string.length);

      return string.lastIndexOf(target, position) == position;
    }

    /**
     * Creates a compiled template function that can interpolate data properties
     * in "interpolate" delimiters, HTML-escape interpolated data properties in
     * "escape" delimiters, and execute JavaScript in "evaluate" delimiters. Data
     * properties may be accessed as free variables in the template. If a setting
     * object is provided it takes precedence over `_.templateSettings` values.
     *
     * **Note:** In the development build `_.template` utilizes
     * [sourceURLs](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl)
     * for easier debugging.
     *
     * For more information on precompiling templates see
     * [lodash's custom builds documentation](https://lodash.com/custom-builds).
     *
     * For more information on Chrome extension sandboxes see
     * [Chrome's extensions documentation](https://developer.chrome.com/extensions/sandboxingEval).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The template string.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The HTML "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as free variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [options.sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [options.variable] The data object variable name.
     * @param- {Object} [otherOptions] Enables the legacy `options` param signature.
     * @returns {Function} Returns the compiled template function.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= user %>!');
     * compiled({ 'user': 'fred' });
     * // => 'hello fred!'
     *
     * // using the HTML "escape" delimiter to escape data property values
     * var compiled = _.template('<b><%- value %></b>');
     * compiled({ 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to execute JavaScript and generate HTML
     * var compiled = _.template('<% _.forEach(users, function(user) { %><li><%- user %></li><% }); %>');
     * compiled({ 'users': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * var compiled = _.template('<% print("hello " + user); %>!');
     * compiled({ 'user': 'barney' });
     * // => 'hello barney!'
     *
     * // using the ES delimiter as an alternative to the default "interpolate" delimiter
     * var compiled = _.template('hello ${ user }!');
     * compiled({ 'user': 'pebbles' });
     * // => 'hello pebbles!'
     *
     * // using custom template delimiters
     * _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
     * var compiled = _.template('hello {{ user }}!');
     * compiled({ 'user': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using backslashes to treat delimiters as plain text
     * var compiled = _.template('<%= "\\<%- value %\\>" %>');
     * compiled({ 'value': 'ignored' });
     * // => '<%- value %>'
     *
     * // using the `imports` option to import `jQuery` as `jq`
     * var text = '<% jq.each(users, function(user) { %><li><%- user %></li><% }); %>';
     * var compiled = _.template(text, { 'imports': { 'jq': jQuery } });
     * compiled({ 'users': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= user %>!', { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.user %>!', { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     * //   var __t, __p = '';
     * //   __p += 'hi ' + ((__t = ( data.user )) == null ? '' : __t) + '!';
     * //   return __p;
     * // }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(string, options, otherOptions) {
      // Based on John Resig's `tmpl` implementation (http://ejohn.org/blog/javascript-micro-templating/)
      // and Laura Doktorova's doT.js (https://github.com/olado/doT).
      var settings = lodash.templateSettings;

      if (otherOptions && isIterateeCall(string, options, otherOptions)) {
        options = otherOptions = null;
      }
      string = baseToString(string);
      options = assignWith(baseAssign({}, otherOptions || options), settings, assignOwnDefaults);

      var imports = assignWith(baseAssign({}, options.imports), settings.imports, assignOwnDefaults),
          importsKeys = keys(imports),
          importsValues = baseValues(imports, importsKeys);

      var isEscaping,
          isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // Compile the regexp to match each delimiter.
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      // Use a sourceURL for easier debugging.
      var sourceURL = '//# sourceURL=' +
        ('sourceURL' in options
          ? options.sourceURL
          : ('lodash.templateSources[' + (++templateCounter) + ']')
        ) + '\n';

      string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // Escape characters that can't be included in string literals.
        source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // Replace delimiters with snippets.
        if (escapeValue) {
          isEscaping = true;
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // The JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value.
        return match;
      });

      source += "';\n";

      // If `variable` is not specified wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain.
      var variable = options.variable;
      if (!variable) {
        source = 'with (obj) {\n' + source + '\n}\n';
      }
      // Cleanup code by stripping empty strings.
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // Frame code as the function body.
      source = 'function(' + (variable || 'obj') + ') {\n' +
        (variable
          ? ''
          : 'obj || (obj = {});\n'
        ) +
        "var __t, __p = ''" +
        (isEscaping
           ? ', __e = _.escape'
           : ''
        ) +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      var result = attempt(function() {
        return Function(importsKeys, sourceURL + 'return ' + source).apply(undefined, importsValues);
      });

      // Provide the compiled function's source by its `toString` method or
      // the `source` property as a convenience for inlining compiled templates.
      result.source = source;
      if (isError(result)) {
        throw result;
      }
      return result;
    }

    /**
     * Removes leading and trailing whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trim('  abc  ');
     * // => 'abc'
     *
     * _.trim('-_-abc-_-', '_-');
     * // => 'abc'
     *
     * _.map(['  foo  ', '  bar  '], _.trim);
     * // => ['foo', 'bar']
     */
    function trim(string, chars, guard) {
      var value = string;
      string = baseToString(string);
      if (!string) {
        return string;
      }
      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
        return string.slice(trimmedLeftIndex(string), trimmedRightIndex(string) + 1);
      }
      chars = (chars + '');
      return string.slice(charsLeftIndex(string, chars), charsRightIndex(string, chars) + 1);
    }

    /**
     * Removes leading whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trimLeft('  abc  ');
     * // => 'abc  '
     *
     * _.trimLeft('-_-abc-_-', '_-');
     * // => 'abc-_-'
     */
    function trimLeft(string, chars, guard) {
      var value = string;
      string = baseToString(string);
      if (!string) {
        return string;
      }
      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
        return string.slice(trimmedLeftIndex(string));
      }
      return string.slice(charsLeftIndex(string, (chars + '')));
    }

    /**
     * Removes trailing whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trimRight('  abc  ');
     * // => '  abc'
     *
     * _.trimRight('-_-abc-_-', '_-');
     * // => '-_-abc'
     */
    function trimRight(string, chars, guard) {
      var value = string;
      string = baseToString(string);
      if (!string) {
        return string;
      }
      if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
        return string.slice(0, trimmedRightIndex(string) + 1);
      }
      return string.slice(0, charsRightIndex(string, (chars + '')) + 1);
    }

    /**
     * Truncates `string` if it is longer than the given maximum string length.
     * The last characters of the truncated string are replaced with the omission
     * string which defaults to "...".
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to truncate.
     * @param {Object|number} [options] The options object or maximum string length.
     * @param {number} [options.length=30] The maximum string length.
     * @param {string} [options.omission='...'] The string to indicate text is omitted.
     * @param {RegExp|string} [options.separator] The separator pattern to truncate to.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {string} Returns the truncated string.
     * @example
     *
     * _.trunc('hi-diddly-ho there, neighborino');
     * // => 'hi-diddly-ho there, neighbo...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', 24);
     * // => 'hi-diddly-ho there, n...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', {
     *   'length': 24,
     *   'separator': ' '
     * });
     * // => 'hi-diddly-ho there,...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', {
     *   'length': 24,
     *   'separator': /,? +/
     * });
     * // => 'hi-diddly-ho there...'
     *
     * _.trunc('hi-diddly-ho there, neighborino', {
     *   'omission': ' [...]'
     * });
     * // => 'hi-diddly-ho there, neig [...]'
     */
    function trunc(string, options, guard) {
      if (guard && isIterateeCall(string, options, guard)) {
        options = null;
      }
      var length = DEFAULT_TRUNC_LENGTH,
          omission = DEFAULT_TRUNC_OMISSION;

      if (options != null) {
        if (isObject(options)) {
          var separator = 'separator' in options ? options.separator : separator;
          length = 'length' in options ? (+options.length || 0) : length;
          omission = 'omission' in options ? baseToString(options.omission) : omission;
        } else {
          length = +options || 0;
        }
      }
      string = baseToString(string);
      if (length >= string.length) {
        return string;
      }
      var end = length - omission.length;
      if (end < 1) {
        return omission;
      }
      var result = string.slice(0, end);
      if (separator == null) {
        return result + omission;
      }
      if (isRegExp(separator)) {
        if (string.slice(end).search(separator)) {
          var match,
              newEnd,
              substring = string.slice(0, end);

          if (!separator.global) {
            separator = RegExp(separator.source, (reFlags.exec(separator) || '') + 'g');
          }
          separator.lastIndex = 0;
          while ((match = separator.exec(substring))) {
            newEnd = match.index;
          }
          result = result.slice(0, newEnd == null ? end : newEnd);
        }
      } else if (string.indexOf(separator, end) != end) {
        var index = result.lastIndexOf(separator);
        if (index > -1) {
          result = result.slice(0, index);
        }
      }
      return result + omission;
    }

    /**
     * The inverse of `_.escape`; this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, and `&#96;` in `string` to their
     * corresponding characters.
     *
     * **Note:** No other HTML entities are unescaped. To unescape additional HTML
     * entities use a third-party library like [_he_](https://mths.be/he).
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('fred, barney, &amp; pebbles');
     * // => 'fred, barney, & pebbles'
     */
    function unescape(string) {
      string = baseToString(string);
      return (string && reHasEscapedHtml.test(string))
        ? string.replace(reEscapedHtml, unescapeHtmlChar)
        : string;
    }

    /**
     * Splits `string` into an array of its words.
     *
     * @static
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to inspect.
     * @param {RegExp|string} [pattern] The pattern to match words.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Array} Returns the words of `string`.
     * @example
     *
     * _.words('fred, barney, & pebbles');
     * // => ['fred', 'barney', 'pebbles']
     *
     * _.words('fred, barney, & pebbles', /[^, ]+/g);
     * // => ['fred', 'barney', '&', 'pebbles']
     */
    function words(string, pattern, guard) {
      if (guard && isIterateeCall(string, pattern, guard)) {
        pattern = null;
      }
      string = baseToString(string);
      return string.match(pattern || reWords) || [];
    }

    /*------------------------------------------------------------------------*/

    /**
     * Attempts to invoke `func`, returning either the result or the caught error
     * object. Any additional arguments are provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Function} func The function to attempt.
     * @returns {*} Returns the `func` result or error object.
     * @example
     *
     * // avoid throwing errors for invalid selectors
     * var elements = _.attempt(function(selector) {
     *   return document.querySelectorAll(selector);
     * }, '>_>');
     *
     * if (_.isError(elements)) {
     *   elements = [];
     * }
     */
    var attempt = restParam(function(func, args) {
      try {
        return func.apply(undefined, args);
      } catch(e) {
        return isError(e) ? e : new Error(e);
      }
    });

    /**
     * Creates a function that invokes `func` with the `this` binding of `thisArg`
     * and arguments of the created function. If `func` is a property name the
     * created callback returns the property value for a given element. If `func`
     * is an object the created callback returns `true` for elements that contain
     * the equivalent object properties, otherwise it returns `false`.
     *
     * @static
     * @memberOf _
     * @alias iteratee
     * @category Utility
     * @param {*} [func=_.identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
     * @returns {Function} Returns the callback.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.callback = _.wrap(_.callback, function(callback, func, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(func);
     *   if (!match) {
     *     return callback(func, thisArg);
     *   }
     *   return function(object) {
     *     return match[2] == 'gt'
     *       ? object[match[1]] > match[3]
     *       : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(users, 'age__gt36');
     * // => [{ 'user': 'fred', 'age': 40 }]
     */
    function callback(func, thisArg, guard) {
      if (guard && isIterateeCall(func, thisArg, guard)) {
        thisArg = null;
      }
      return baseCallback(func, thisArg);
    }

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'user': 'fred' };
     * var getter = _.constant(object);
     *
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'user': 'fred' };
     *
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Creates a function which performs a deep comparison between a given object
     * and `source`, returning `true` if the given object has equivalent property
     * values, else `false`.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties. For comparing a single
     * own or inherited property value see `_.matchesProperty`.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Object} source The object of property values to match.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * _.filter(users, _.matches({ 'age': 40, 'active': false }));
     * // => [{ 'user': 'fred', 'age': 40, 'active': false }]
     */
    function matches(source) {
      return baseMatches(baseClone(source, true));
    }

    /**
     * Creates a function which compares the property value of `path` on a given
     * object to `value`.
     *
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,
     * numbers, `Object` objects, regexes, and strings. Objects are compared by
     * their own, not inherited, enumerable properties.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Array|string} path The path of the property to get.
     * @param {*} value The value to compare.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * _.find(users, _.matchesProperty('user', 'fred'));
     * // => { 'user': 'fred' }
     */
    function matchesProperty(path, value) {
      return baseMatchesProperty(path, baseClone(value, true));
    }

    /**
     * Creates a function which invokes the method at `path` on a given object.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Array|string} path The path of the method to invoke.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var objects = [
     *   { 'a': { 'b': { 'c': _.constant(2) } } },
     *   { 'a': { 'b': { 'c': _.constant(1) } } }
     * ];
     *
     * _.map(objects, _.method('a.b.c'));
     * // => [2, 1]
     *
     * _.invoke(_.sortBy(objects, _.method(['a', 'b', 'c'])), 'a.b.c');
     * // => [1, 2]
     */
    var method = restParam(function(path, args) {
      return function(object) {
        return invokePath(object, path, args);
      }
    });

    /**
     * The opposite of `_.method`; this method creates a function which invokes
     * the method at a given path on `object`.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Object} object The object to query.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var array = _.times(3, _.constant),
     *     object = { 'a': array, 'b': array, 'c': array };
     *
     * _.map(['a[2]', 'c[0]'], _.methodOf(object));
     * // => [2, 0]
     *
     * _.map([['a', '2'], ['c', '0']], _.methodOf(object));
     * // => [2, 0]
     */
    var methodOf = restParam(function(object, args) {
      return function(path) {
        return invokePath(object, path, args);
      };
    });

    /**
     * Adds all own enumerable function properties of a source object to the
     * destination object. If `object` is a function then methods are added to
     * its prototype as well.
     *
     * **Note:** Use `_.runInContext` to create a pristine `lodash` function to
     * avoid conflicts caused by modifying the original.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Function|Object} [object=lodash] The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added
     *  are chainable.
     * @returns {Function|Object} Returns `object`.
     * @example
     *
     * function vowels(string) {
     *   return _.filter(string, function(v) {
     *     return /[aeiou]/i.test(v);
     *   });
     * }
     *
     * // use `_.runInContext` to avoid conflicts (esp. in Node.js)
     * var _ = require('lodash').runInContext();
     *
     * _.mixin({ 'vowels': vowels });
     * _.vowels('fred');
     * // => ['e']
     *
     * _('fred').vowels().value();
     * // => ['e']
     *
     * _.mixin({ 'vowels': vowels }, { 'chain': false });
     * _('fred').vowels();
     * // => ['e']
     */
    function mixin(object, source, options) {
      if (options == null) {
        var isObj = isObject(source),
            props = isObj && keys(source),
            methodNames = props && props.length && baseFunctions(source, props);

        if (!(methodNames ? methodNames.length : isObj)) {
          methodNames = false;
          options = source;
          source = object;
          object = this;
        }
      }
      if (!methodNames) {
        methodNames = baseFunctions(source, keys(source));
      }
      var chain = true,
          index = -1,
          isFunc = isFunction(object),
          length = methodNames.length;

      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      while (++index < length) {
        var methodName = methodNames[index],
            func = source[methodName];

        object[methodName] = func;
        if (isFunc) {
          object.prototype[methodName] = (function(func) {
            return function() {
              var chainAll = this.__chain__;
              if (chain || chainAll) {
                var result = object(this.__wrapped__),
                    actions = result.__actions__ = arrayCopy(this.__actions__);

                actions.push({ 'func': func, 'args': arguments, 'thisArg': object });
                result.__chain__ = chainAll;
                return result;
              }
              var args = [this.value()];
              push.apply(args, arguments);
              return func.apply(object, args);
            };
          }(func));
        }
      }
      return object;
    }

    /**
     * Reverts the `_` variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * A no-operation function which returns `undefined` regardless of the
     * arguments it receives.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @example
     *
     * var object = { 'user': 'fred' };
     *
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // No operation performed.
    }

    /**
     * Creates a function which returns the property value at `path` on a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var objects = [
     *   { 'a': { 'b': { 'c': 2 } } },
     *   { 'a': { 'b': { 'c': 1 } } }
     * ];
     *
     * _.map(objects, _.property('a.b.c'));
     * // => [2, 1]
     *
     * _.pluck(_.sortBy(objects, _.property(['a', 'b', 'c'])), 'a.b.c');
     * // => [1, 2]
     */
    function property(path) {
      return isKey(path) ? baseProperty(path) : basePropertyDeep(path);
    }

    /**
     * The opposite of `_.property`; this method creates a function which returns
     * the property value at a given path on `object`.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {Object} object The object to query.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var array = [0, 1, 2],
     *     object = { 'a': array, 'b': array, 'c': array };
     *
     * _.map(['a[2]', 'c[0]'], _.propertyOf(object));
     * // => [2, 0]
     *
     * _.map([['a', '2'], ['c', '0']], _.propertyOf(object));
     * // => [2, 0]
     */
    function propertyOf(object) {
      return function(path) {
        return baseGet(object, toPath(path), path + '');
      };
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to, but not including, `end`. If `end` is not specified it is
     * set to `start` with `start` then set to `0`. If `end` is less than `start`
     * a zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns the new array of numbers.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      if (step && isIterateeCall(start, end, step)) {
        end = step = null;
      }
      start = +start || 0;
      step = step == null ? 1 : (+step || 0);

      if (end == null) {
        end = start;
        start = 0;
      } else {
        end = +end || 0;
      }
      // Use `Array(length)` so engines like Chakra and V8 avoid slower modes.
      // See https://youtu.be/XAqIpGU8ZZk#t=17m25s for more details.
      var index = -1,
          length = nativeMax(ceil((end - start) / (step || 1)), 0),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Invokes the iteratee function `n` times, returning an array of the results
     * of each invocation. The `iteratee` is bound to `thisArg` and invoked with
     * one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {Array} Returns the array of results.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6, false));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) {
     *   mage.castSpell(n);
     * });
     * // => invokes `mage.castSpell(n)` three times with `n` of `0`, `1`, and `2`
     *
     * _.times(3, function(n) {
     *   this.cast(n);
     * }, mage);
     * // => also invokes `mage.castSpell(n)` three times
     */
    function times(n, iteratee, thisArg) {
      n = floor(n);

      // Exit early to avoid a JSC JIT bug in Safari 8
      // where `Array(0)` is treated as `Array(1)`.
      if (n < 1 || !nativeIsFinite(n)) {
        return [];
      }
      var index = -1,
          result = Array(nativeMin(n, MAX_ARRAY_LENGTH));

      iteratee = bindCallback(iteratee, thisArg, 1);
      while (++index < n) {
        if (index < MAX_ARRAY_LENGTH) {
          result[index] = iteratee(index);
        } else {
          iteratee(index);
        }
      }
      return result;
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID is appended to it.
     *
     * @static
     * @memberOf _
     * @category Utility
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return baseToString(prefix) + id;
    }

    /*------------------------------------------------------------------------*/

    /**
     * Adds two numbers.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {number} augend The first number to add.
     * @param {number} addend The second number to add.
     * @returns {number} Returns the sum.
     * @example
     *
     * _.add(6, 4);
     * // => 10
     */
    function add(augend, addend) {
      return (+augend || 0) + (+addend || 0);
    }

    /**
     * Gets the maximum value of `collection`. If `collection` is empty or falsey
     * `-Infinity` is returned. If an iteratee function is provided it is invoked
     * for each value in `collection` to generate the criterion by which the value
     * is ranked. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * _.max([]);
     * // => -Infinity
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * _.max(users, function(chr) {
     *   return chr.age;
     * });
     * // => { 'user': 'fred', 'age': 40 }
     *
     * // using the `_.property` callback shorthand
     * _.max(users, 'age');
     * // => { 'user': 'fred', 'age': 40 }
     */
    var max = createExtremum(arrayMax);

    /**
     * Gets the minimum value of `collection`. If `collection` is empty or falsey
     * `Infinity` is returned. If an iteratee function is provided it is invoked
     * for each value in `collection` to generate the criterion by which the value
     * is ranked. The `iteratee` is bound to `thisArg` and invoked with three
     * arguments: (value, index, collection).
     *
     * If a property name is provided for `iteratee` the created `_.property`
     * style callback returns the property value of the given element.
     *
     * If a value is also provided for `thisArg` the created `_.matchesProperty`
     * style callback returns `true` for elements that have a matching property
     * value, else `false`.
     *
     * If an object is provided for `iteratee` the created `_.matches` style
     * callback returns `true` for elements that have the properties of the given
     * object, else `false`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * _.min([]);
     * // => Infinity
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * _.min(users, function(chr) {
     *   return chr.age;
     * });
     * // => { 'user': 'barney', 'age': 36 }
     *
     * // using the `_.property` callback shorthand
     * _.min(users, 'age');
     * // => { 'user': 'barney', 'age': 36 }
     */
    var min = createExtremum(arrayMin, true);

    /**
     * Gets the sum of the values in `collection`.
     *
     * @static
     * @memberOf _
     * @category Math
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.
     * @param {*} [thisArg] The `this` binding of `iteratee`.
     * @returns {number} Returns the sum.
     * @example
     *
     * _.sum([4, 6]);
     * // => 10
     *
     * _.sum({ 'a': 4, 'b': 6 });
     * // => 10
     *
     * var objects = [
     *   { 'n': 4 },
     *   { 'n': 6 }
     * ];
     *
     * _.sum(objects, function(object) {
     *   return object.n;
     * });
     * // => 10
     *
     * // using the `_.property` callback shorthand
     * _.sum(objects, 'n');
     * // => 10
     */
    function sum(collection, iteratee, thisArg) {
      if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {
        iteratee = null;
      }
      var func = getCallback(),
          noIteratee = iteratee == null;

      if (!(func === baseCallback && noIteratee)) {
        noIteratee = false;
        iteratee = func(iteratee, thisArg, 3);
      }
      return noIteratee
        ? arraySum(isArray(collection) ? collection : toIterable(collection))
        : baseSum(collection, iteratee);
    }

    /*------------------------------------------------------------------------*/

    // Ensure wrappers are instances of `baseLodash`.
    lodash.prototype = baseLodash.prototype;

    LodashWrapper.prototype = baseCreate(baseLodash.prototype);
    LodashWrapper.prototype.constructor = LodashWrapper;

    LazyWrapper.prototype = baseCreate(baseLodash.prototype);
    LazyWrapper.prototype.constructor = LazyWrapper;

    // Add functions to the `Map` cache.
    MapCache.prototype['delete'] = mapDelete;
    MapCache.prototype.get = mapGet;
    MapCache.prototype.has = mapHas;
    MapCache.prototype.set = mapSet;

    // Add functions to the `Set` cache.
    SetCache.prototype.push = cachePush;

    // Assign cache to `_.memoize`.
    memoize.Cache = MapCache;

    // Add functions that return wrapped values when chaining.
    lodash.after = after;
    lodash.ary = ary;
    lodash.assign = assign;
    lodash.at = at;
    lodash.before = before;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.callback = callback;
    lodash.chain = chain;
    lodash.chunk = chunk;
    lodash.compact = compact;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.curry = curry;
    lodash.curryRight = curryRight;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.drop = drop;
    lodash.dropRight = dropRight;
    lodash.dropRightWhile = dropRightWhile;
    lodash.dropWhile = dropWhile;
    lodash.fill = fill;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.flattenDeep = flattenDeep;
    lodash.flow = flow;
    lodash.flowRight = flowRight;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.keysIn = keysIn;
    lodash.map = map;
    lodash.mapValues = mapValues;
    lodash.matches = matches;
    lodash.matchesProperty = matchesProperty;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.method = method;
    lodash.methodOf = methodOf;
    lodash.mixin = mixin;
    lodash.negate = negate;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.partition = partition;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.propertyOf = propertyOf;
    lodash.pull = pull;
    lodash.pullAt = pullAt;
    lodash.range = range;
    lodash.rearg = rearg;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.restParam = restParam;
    lodash.set = set;
    lodash.shuffle = shuffle;
    lodash.slice = slice;
    lodash.sortBy = sortBy;
    lodash.sortByAll = sortByAll;
    lodash.sortByOrder = sortByOrder;
    lodash.spread = spread;
    lodash.take = take;
    lodash.takeRight = takeRight;
    lodash.takeRightWhile = takeRightWhile;
    lodash.takeWhile = takeWhile;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.thru = thru;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.toPlainObject = toPlainObject;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.unzip = unzip;
    lodash.values = values;
    lodash.valuesIn = valuesIn;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // Add aliases.
    lodash.backflow = flowRight;
    lodash.collect = map;
    lodash.compose = flowRight;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.iteratee = callback;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;

    // Add functions to `lodash.prototype`.
    mixin(lodash, lodash);

    /*------------------------------------------------------------------------*/

    // Add functions that return unwrapped values when chaining.
    lodash.add = add;
    lodash.attempt = attempt;
    lodash.camelCase = camelCase;
    lodash.capitalize = capitalize;
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.deburr = deburr;
    lodash.endsWith = endsWith;
    lodash.escape = escape;
    lodash.escapeRegExp = escapeRegExp;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.findWhere = findWhere;
    lodash.first = first;
    lodash.get = get;
    lodash.has = has;
    lodash.identity = identity;
    lodash.includes = includes;
    lodash.indexOf = indexOf;
    lodash.inRange = inRange;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isError = isError;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isMatch = isMatch;
    lodash.isNaN = isNaN;
    lodash.isNative = isNative;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isTypedArray = isTypedArray;
    lodash.isUndefined = isUndefined;
    lodash.kebabCase = kebabCase;
    lodash.last = last;
    lodash.lastIndexOf = lastIndexOf;
    lodash.max = max;
    lodash.min = min;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.pad = pad;
    lodash.padLeft = padLeft;
    lodash.padRight = padRight;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.repeat = repeat;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.snakeCase = snakeCase;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.sortedLastIndex = sortedLastIndex;
    lodash.startCase = startCase;
    lodash.startsWith = startsWith;
    lodash.sum = sum;
    lodash.template = template;
    lodash.trim = trim;
    lodash.trimLeft = trimLeft;
    lodash.trimRight = trimRight;
    lodash.trunc = trunc;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;
    lodash.words = words;

    // Add aliases.
    lodash.all = every;
    lodash.any = some;
    lodash.contains = includes;
    lodash.detect = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.head = first;
    lodash.include = includes;
    lodash.inject = reduce;

    mixin(lodash, (function() {
      var source = {};
      baseForOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }()), false);

    /*------------------------------------------------------------------------*/

    // Add functions capable of returning wrapped and unwrapped values when chaining.
    lodash.sample = sample;

    lodash.prototype.sample = function(n) {
      if (!this.__chain__ && n == null) {
        return sample(this.value());
      }
      return this.thru(function(value) {
        return sample(value, n);
      });
    };

    /*------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = VERSION;

    // Assign default placeholders.
    arrayEach(['bind', 'bindKey', 'curry', 'curryRight', 'partial', 'partialRight'], function(methodName) {
      lodash[methodName].placeholder = lodash;
    });

    // Add `LazyWrapper` methods that accept an `iteratee` value.
    arrayEach(['dropWhile', 'filter', 'map', 'takeWhile'], function(methodName, type) {
      var isFilter = type != LAZY_MAP_FLAG,
          isDropWhile = type == LAZY_DROP_WHILE_FLAG;

      LazyWrapper.prototype[methodName] = function(iteratee, thisArg) {
        var filtered = this.__filtered__,
            result = (filtered && isDropWhile) ? new LazyWrapper(this) : this.clone(),
            iteratees = result.__iteratees__ || (result.__iteratees__ = []);

        iteratees.push({
          'done': false,
          'count': 0,
          'index': 0,
          'iteratee': getCallback(iteratee, thisArg, 1),
          'limit': -1,
          'type': type
        });

        result.__filtered__ = filtered || isFilter;
        return result;
      };
    });

    // Add `LazyWrapper` methods for `_.drop` and `_.take` variants.
    arrayEach(['drop', 'take'], function(methodName, index) {
      var whileName = methodName + 'While';

      LazyWrapper.prototype[methodName] = function(n) {
        var filtered = this.__filtered__,
            result = (filtered && !index) ? this.dropWhile() : this.clone();

        n = n == null ? 1 : nativeMax(floor(n) || 0, 0);
        if (filtered) {
          if (index) {
            result.__takeCount__ = nativeMin(result.__takeCount__, n);
          } else {
            last(result.__iteratees__).limit = n;
          }
        } else {
          var views = result.__views__ || (result.__views__ = []);
          views.push({ 'size': n, 'type': methodName + (result.__dir__ < 0 ? 'Right' : '') });
        }
        return result;
      };

      LazyWrapper.prototype[methodName + 'Right'] = function(n) {
        return this.reverse()[methodName](n).reverse();
      };

      LazyWrapper.prototype[methodName + 'RightWhile'] = function(predicate, thisArg) {
        return this.reverse()[whileName](predicate, thisArg).reverse();
      };
    });

    // Add `LazyWrapper` methods for `_.first` and `_.last`.
    arrayEach(['first', 'last'], function(methodName, index) {
      var takeName = 'take' + (index ? 'Right' : '');

      LazyWrapper.prototype[methodName] = function() {
        return this[takeName](1).value()[0];
      };
    });

    // Add `LazyWrapper` methods for `_.initial` and `_.rest`.
    arrayEach(['initial', 'rest'], function(methodName, index) {
      var dropName = 'drop' + (index ? '' : 'Right');

      LazyWrapper.prototype[methodName] = function() {
        return this[dropName](1);
      };
    });

    // Add `LazyWrapper` methods for `_.pluck` and `_.where`.
    arrayEach(['pluck', 'where'], function(methodName, index) {
      var operationName = index ? 'filter' : 'map',
          createCallback = index ? baseMatches : property;

      LazyWrapper.prototype[methodName] = function(value) {
        return this[operationName](createCallback(value));
      };
    });

    LazyWrapper.prototype.compact = function() {
      return this.filter(identity);
    };

    LazyWrapper.prototype.reject = function(predicate, thisArg) {
      predicate = getCallback(predicate, thisArg, 1);
      return this.filter(function(value) {
        return !predicate(value);
      });
    };

    LazyWrapper.prototype.slice = function(start, end) {
      start = start == null ? 0 : (+start || 0);
      var result = start < 0 ? this.takeRight(-start) : this.drop(start);

      if (end !== undefined) {
        end = (+end || 0);
        result = end < 0 ? result.dropRight(-end) : result.take(end - start);
      }
      return result;
    };

    LazyWrapper.prototype.toArray = function() {
      return this.drop(0);
    };

    // Add `LazyWrapper` methods to `lodash.prototype`.
    baseForOwn(LazyWrapper.prototype, function(func, methodName) {
      var lodashFunc = lodash[methodName];
      if (!lodashFunc) {
        return;
      }
      var checkIteratee = /^(?:filter|map|reject)|While$/.test(methodName),
          retUnwrapped = /^(?:first|last)$/.test(methodName);

      lodash.prototype[methodName] = function() {
        var args = arguments,
            length = args.length,
            chainAll = this.__chain__,
            value = this.__wrapped__,
            isHybrid = !!this.__actions__.length,
            isLazy = value instanceof LazyWrapper,
            iteratee = args[0],
            useLazy = isLazy || isArray(value);

        if (useLazy && checkIteratee && typeof iteratee == 'function' && iteratee.length != 1) {
          // avoid lazy use if the iteratee has a "length" value other than `1`
          isLazy = useLazy = false;
        }
        var onlyLazy = isLazy && !isHybrid;
        if (retUnwrapped && !chainAll) {
          return onlyLazy
            ? func.call(value)
            : lodashFunc.call(lodash, this.value());
        }
        var interceptor = function(value) {
          var otherArgs = [value];
          push.apply(otherArgs, args);
          return lodashFunc.apply(lodash, otherArgs);
        };
        if (useLazy) {
          var wrapper = onlyLazy ? value : new LazyWrapper(this),
              result = func.apply(wrapper, args);

          if (!retUnwrapped && (isHybrid || result.__actions__)) {
            var actions = result.__actions__ || (result.__actions__ = []);
            actions.push({ 'func': thru, 'args': [interceptor], 'thisArg': lodash });
          }
          return new LodashWrapper(result, chainAll);
        }
        return this.thru(interceptor);
      };
    });

    // Add `Array` and `String` methods to `lodash.prototype`.
    arrayEach(['concat', 'join', 'pop', 'push', 'replace', 'shift', 'sort', 'splice', 'split', 'unshift'], function(methodName) {
      var func = (/^(?:replace|split)$/.test(methodName) ? stringProto : arrayProto)[methodName],
          chainName = /^(?:push|sort|unshift)$/.test(methodName) ? 'tap' : 'thru',
          retUnwrapped = /^(?:join|pop|replace|shift)$/.test(methodName);

      lodash.prototype[methodName] = function() {
        var args = arguments;
        if (retUnwrapped && !this.__chain__) {
          return func.apply(this.value(), args);
        }
        return this[chainName](function(value) {
          return func.apply(value, args);
        });
      };
    });

    // Map minified function names to their real names.
    baseForOwn(LazyWrapper.prototype, function(func, methodName) {
      var lodashFunc = lodash[methodName];
      if (lodashFunc) {
        var key = lodashFunc.name,
            names = realNames[key] || (realNames[key] = []);

        names.push({ 'name': methodName, 'func': lodashFunc });
      }
    });

    realNames[createHybridWrapper(null, BIND_KEY_FLAG).name] = [{ 'name': 'wrapper', 'func': null }];

    // Add functions to the lazy wrapper.
    LazyWrapper.prototype.clone = lazyClone;
    LazyWrapper.prototype.reverse = lazyReverse;
    LazyWrapper.prototype.value = lazyValue;

    // Add chaining functions to the `lodash` wrapper.
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.commit = wrapperCommit;
    lodash.prototype.plant = wrapperPlant;
    lodash.prototype.reverse = wrapperReverse;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.run = lodash.prototype.toJSON = lodash.prototype.valueOf = lodash.prototype.value = wrapperValue;

    // Add function aliases to the `lodash` wrapper.
    lodash.prototype.collect = lodash.prototype.map;
    lodash.prototype.head = lodash.prototype.first;
    lodash.prototype.select = lodash.prototype.filter;
    lodash.prototype.tail = lodash.prototype.rest;

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // Export lodash.
  var _ = runInContext();

  // Some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose lodash to the global object when an AMD loader is present to avoid
    // errors in cases where lodash is loaded by a script tag and not intended
    // as an AMD module. See http://requirejs.org/docs/errors.html#mismatch for
    // more details.
    root._ = _;

    // Define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module.
    define(function() {
      return _;
    });
  }
  // Check for `exports` after `define` in case a build optimizer adds an `exports` object.
  else if (freeExports && freeModule) {
    // Export for Node.js or RingoJS.
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // Export for Narwhal or Rhino -require.
    else {
      freeExports._ = _;
    }
  }
  else {
    // Export for a browser or Rhino.
    root._ = _;
  }
}.call(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
function DOMParser(options){
	this.options = options ||{locator:{}};
	
}
DOMParser.prototype.parseFromString = function(source,mimeType){	
	var options = this.options;
	var sax =  new XMLReader();
	var domBuilder = options.domBuilder || new DOMHandler();//contentHandler and LexicalHandler
	var errorHandler = options.errorHandler;
	var locator = options.locator;
	var defaultNSMap = options.xmlns||{};
	var entityMap = {'lt':'<','gt':'>','amp':'&','quot':'"','apos':"'"}
	if(locator){
		domBuilder.setDocumentLocator(locator)
	}
	
	sax.errorHandler = buildErrorHandler(errorHandler,domBuilder,locator);
	sax.domBuilder = options.domBuilder || domBuilder;
	if(/\/x?html?$/.test(mimeType)){
		entityMap.nbsp = '\xa0';
		entityMap.copy = '\xa9';
		defaultNSMap['']= 'http://www.w3.org/1999/xhtml';
	}
	if(source){
		sax.parse(source,defaultNSMap,entityMap);
	}else{
		sax.errorHandler.error("invalid document source");
	}
	return domBuilder.document;
}
function buildErrorHandler(errorImpl,domBuilder,locator){
	if(!errorImpl){
		if(domBuilder instanceof DOMHandler){
			return domBuilder;
		}
		errorImpl = domBuilder ;
	}
	var errorHandler = {}
	var isCallback = errorImpl instanceof Function;
	locator = locator||{}
	function build(key){
		var fn = errorImpl[key];
		if(!fn){
			if(isCallback){
				fn = errorImpl.length == 2?function(msg){errorImpl(key,msg)}:errorImpl;
			}else{
				var i=arguments.length;
				while(--i){
					if(fn = errorImpl[arguments[i]]){
						break;
					}
				}
			}
		}
		errorHandler[key] = fn && function(msg){
			fn(msg+_locator(locator));
		}||function(){};
	}
	build('warning','warn');
	build('error','warn','warning');
	build('fatalError','warn','warning','error');
	return errorHandler;
}
/**
 * +ContentHandler+ErrorHandler
 * +LexicalHandler+EntityResolver2
 * -DeclHandler-DTDHandler 
 * 
 * DefaultHandler:EntityResolver, DTDHandler, ContentHandler, ErrorHandler
 * DefaultHandler2:DefaultHandler,LexicalHandler, DeclHandler, EntityResolver2
 * @link http://www.saxproject.org/apidoc/org/xml/sax/helpers/DefaultHandler.html
 */
function DOMHandler() {
    this.cdata = false;
}
function position(locator,node){
	node.lineNumber = locator.lineNumber;
	node.columnNumber = locator.columnNumber;
}
/**
 * @see org.xml.sax.ContentHandler#startDocument
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
 */ 
DOMHandler.prototype = {
	startDocument : function() {
    	this.document = new DOMImplementation().createDocument(null, null, null);
    	if (this.locator) {
        	this.document.documentURI = this.locator.systemId;
    	}
	},
	startElement:function(namespaceURI, localName, qName, attrs) {
		var doc = this.document;
	    var el = doc.createElementNS(namespaceURI, qName||localName);
	    var len = attrs.length;
	    appendElement(this, el);
	    this.currentElement = el;
	    
		this.locator && position(this.locator,el)
	    for (var i = 0 ; i < len; i++) {
	        var namespaceURI = attrs.getURI(i);
	        var value = attrs.getValue(i);
	        var qName = attrs.getQName(i);
			var attr = doc.createAttributeNS(namespaceURI, qName);
			if( attr.getOffset){
				position(attr.getOffset(1),attr)
			}
			attr.value = attr.nodeValue = value;
			el.setAttributeNode(attr)
	    }
	},
	endElement:function(namespaceURI, localName, qName) {
		var current = this.currentElement
	    var tagName = current.tagName;
	    this.currentElement = current.parentNode;
	},
	startPrefixMapping:function(prefix, uri) {
	},
	endPrefixMapping:function(prefix) {
	},
	processingInstruction:function(target, data) {
	    var ins = this.document.createProcessingInstruction(target, data);
	    this.locator && position(this.locator,ins)
	    appendElement(this, ins);
	},
	ignorableWhitespace:function(ch, start, length) {
	},
	characters:function(chars, start, length) {
		chars = _toString.apply(this,arguments)
		//console.log(chars)
		if(this.currentElement && chars){
			if (this.cdata) {
				var charNode = this.document.createCDATASection(chars);
				this.currentElement.appendChild(charNode);
			} else {
				var charNode = this.document.createTextNode(chars);
				this.currentElement.appendChild(charNode);
			}
			this.locator && position(this.locator,charNode)
		}
	},
	skippedEntity:function(name) {
	},
	endDocument:function() {
		this.document.normalize();
	},
	setDocumentLocator:function (locator) {
	    if(this.locator = locator){// && !('lineNumber' in locator)){
	    	locator.lineNumber = 0;
	    }
	},
	//LexicalHandler
	comment:function(chars, start, length) {
		chars = _toString.apply(this,arguments)
	    var comm = this.document.createComment(chars);
	    this.locator && position(this.locator,comm)
	    appendElement(this, comm);
	},
	
	startCDATA:function() {
	    //used in characters() methods
	    this.cdata = true;
	},
	endCDATA:function() {
	    this.cdata = false;
	},
	
	startDTD:function(name, publicId, systemId) {
		var impl = this.document.implementation;
	    if (impl && impl.createDocumentType) {
	        var dt = impl.createDocumentType(name, publicId, systemId);
	        this.locator && position(this.locator,dt)
	        appendElement(this, dt);
	    }
	},
	/**
	 * @see org.xml.sax.ErrorHandler
	 * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
	 */
	warning:function(error) {
		console.warn(error,_locator(this.locator));
	},
	error:function(error) {
		console.error(error,_locator(this.locator));
	},
	fatalError:function(error) {
		console.error(error,_locator(this.locator));
	    throw error;
	}
}
function _locator(l){
	if(l){
		return '\n@'+(l.systemId ||'')+'#[line:'+l.lineNumber+',col:'+l.columnNumber+']'
	}
}
function _toString(chars,start,length){
	if(typeof chars == 'string'){
		return chars.substr(start,length)
	}else{//java sax connect width xmldom on rhino(what about: "? && !(chars instanceof String)")
		if(chars.length >= start+length || start){
			return new java.lang.String(chars,start,length)+'';
		}
		return chars;
	}
}

/*
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/LexicalHandler.html
 * used method of org.xml.sax.ext.LexicalHandler:
 *  #comment(chars, start, length)
 *  #startCDATA()
 *  #endCDATA()
 *  #startDTD(name, publicId, systemId)
 *
 *
 * IGNORED method of org.xml.sax.ext.LexicalHandler:
 *  #endDTD()
 *  #startEntity(name)
 *  #endEntity(name)
 *
 *
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/DeclHandler.html
 * IGNORED method of org.xml.sax.ext.DeclHandler
 * 	#attributeDecl(eName, aName, type, mode, value)
 *  #elementDecl(name, model)
 *  #externalEntityDecl(name, publicId, systemId)
 *  #internalEntityDecl(name, value)
 * @link http://www.saxproject.org/apidoc/org/xml/sax/ext/EntityResolver2.html
 * IGNORED method of org.xml.sax.EntityResolver2
 *  #resolveEntity(String name,String publicId,String baseURI,String systemId)
 *  #resolveEntity(publicId, systemId)
 *  #getExternalSubset(name, baseURI)
 * @link http://www.saxproject.org/apidoc/org/xml/sax/DTDHandler.html
 * IGNORED method of org.xml.sax.DTDHandler
 *  #notationDecl(name, publicId, systemId) {};
 *  #unparsedEntityDecl(name, publicId, systemId, notationName) {};
 */
"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,function(key){
	DOMHandler.prototype[key] = function(){return null}
})

/* Private static helpers treated below as private instance methods, so don't need to add these to the public API; we might use a Relator to also get rid of non-standard public properties */
function appendElement (hander,node) {
    if (!hander.currentElement) {
        hander.document.appendChild(node);
    } else {
        hander.currentElement.appendChild(node);
    }
}//appendChild and setAttributeNS are preformance key

if(typeof require == 'function'){
	var XMLReader = require('./sax').XMLReader;
	var DOMImplementation = exports.DOMImplementation = require('./dom').DOMImplementation;
	exports.XMLSerializer = require('./dom').XMLSerializer ;
	exports.DOMParser = DOMParser;
}

},{"./dom":4,"./sax":5}],4:[function(require,module,exports){
/*
 * DOM Level 2
 * Object DOMException
 * @see http://www.w3.org/TR/REC-DOM-Level-1/ecma-script-language-binding.html
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/ecma-script-binding.html
 */

function copy(src,dest){
	for(var p in src){
		dest[p] = src[p];
	}
}
/**
^\w+\.prototype\.([_\w]+)\s*=\s*((?:.*\{\s*?[\r\n][\s\S]*?^})|\S.*?(?=[;\r\n]));?
^\w+\.prototype\.([_\w]+)\s*=\s*(\S.*?(?=[;\r\n]));?
 */
function _extends(Class,Super){
	var pt = Class.prototype;
	if(Object.create){
		var ppt = Object.create(Super.prototype)
		pt.__proto__ = ppt;
	}
	if(!(pt instanceof Super)){
		function t(){};
		t.prototype = Super.prototype;
		t = new t();
		copy(pt,t);
		Class.prototype = pt = t;
	}
	if(pt.constructor != Class){
		if(typeof Class != 'function'){
			console.error("unknow Class:"+Class)
		}
		pt.constructor = Class
	}
}
var htmlns = 'http://www.w3.org/1999/xhtml' ;
// Node Types
var NodeType = {}
var ELEMENT_NODE                = NodeType.ELEMENT_NODE                = 1;
var ATTRIBUTE_NODE              = NodeType.ATTRIBUTE_NODE              = 2;
var TEXT_NODE                   = NodeType.TEXT_NODE                   = 3;
var CDATA_SECTION_NODE          = NodeType.CDATA_SECTION_NODE          = 4;
var ENTITY_REFERENCE_NODE       = NodeType.ENTITY_REFERENCE_NODE       = 5;
var ENTITY_NODE                 = NodeType.ENTITY_NODE                 = 6;
var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
var COMMENT_NODE                = NodeType.COMMENT_NODE                = 8;
var DOCUMENT_NODE               = NodeType.DOCUMENT_NODE               = 9;
var DOCUMENT_TYPE_NODE          = NodeType.DOCUMENT_TYPE_NODE          = 10;
var DOCUMENT_FRAGMENT_NODE      = NodeType.DOCUMENT_FRAGMENT_NODE      = 11;
var NOTATION_NODE               = NodeType.NOTATION_NODE               = 12;

// ExceptionCode
var ExceptionCode = {}
var ExceptionMessage = {};
var INDEX_SIZE_ERR              = ExceptionCode.INDEX_SIZE_ERR              = ((ExceptionMessage[1]="Index size error"),1);
var DOMSTRING_SIZE_ERR          = ExceptionCode.DOMSTRING_SIZE_ERR          = ((ExceptionMessage[2]="DOMString size error"),2);
var HIERARCHY_REQUEST_ERR       = ExceptionCode.HIERARCHY_REQUEST_ERR       = ((ExceptionMessage[3]="Hierarchy request error"),3);
var WRONG_DOCUMENT_ERR          = ExceptionCode.WRONG_DOCUMENT_ERR          = ((ExceptionMessage[4]="Wrong document"),4);
var INVALID_CHARACTER_ERR       = ExceptionCode.INVALID_CHARACTER_ERR       = ((ExceptionMessage[5]="Invalid character"),5);
var NO_DATA_ALLOWED_ERR         = ExceptionCode.NO_DATA_ALLOWED_ERR         = ((ExceptionMessage[6]="No data allowed"),6);
var NO_MODIFICATION_ALLOWED_ERR = ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = ((ExceptionMessage[7]="No modification allowed"),7);
var NOT_FOUND_ERR               = ExceptionCode.NOT_FOUND_ERR               = ((ExceptionMessage[8]="Not found"),8);
var NOT_SUPPORTED_ERR           = ExceptionCode.NOT_SUPPORTED_ERR           = ((ExceptionMessage[9]="Not supported"),9);
var INUSE_ATTRIBUTE_ERR         = ExceptionCode.INUSE_ATTRIBUTE_ERR         = ((ExceptionMessage[10]="Attribute in use"),10);
//level2
var INVALID_STATE_ERR        	= ExceptionCode.INVALID_STATE_ERR        	= ((ExceptionMessage[11]="Invalid state"),11);
var SYNTAX_ERR               	= ExceptionCode.SYNTAX_ERR               	= ((ExceptionMessage[12]="Syntax error"),12);
var INVALID_MODIFICATION_ERR 	= ExceptionCode.INVALID_MODIFICATION_ERR 	= ((ExceptionMessage[13]="Invalid modification"),13);
var NAMESPACE_ERR            	= ExceptionCode.NAMESPACE_ERR           	= ((ExceptionMessage[14]="Invalid namespace"),14);
var INVALID_ACCESS_ERR       	= ExceptionCode.INVALID_ACCESS_ERR      	= ((ExceptionMessage[15]="Invalid access"),15);


function DOMException(code, message) {
	if(message instanceof Error){
		var error = message;
	}else{
		error = this;
		Error.call(this, ExceptionMessage[code]);
		this.message = ExceptionMessage[code];
		if(Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
	}
	error.code = code;
	if(message) this.message = this.message + ": " + message;
	return error;
};
DOMException.prototype = Error.prototype;
copy(ExceptionCode,DOMException)
/**
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-536297177
 * The NodeList interface provides the abstraction of an ordered collection of nodes, without defining or constraining how this collection is implemented. NodeList objects in the DOM are live.
 * The items in the NodeList are accessible via an integral index, starting from 0.
 */
function NodeList() {
};
NodeList.prototype = {
	/**
	 * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
	 * @standard level1
	 */
	length:0, 
	/**
	 * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
	 * @standard level1
	 * @param index  unsigned long 
	 *   Index into the collection.
	 * @return Node
	 * 	The node at the indexth position in the NodeList, or null if that is not a valid index. 
	 */
	item: function(index) {
		return this[index] || null;
	}
};
function LiveNodeList(node,refresh){
	this._node = node;
	this._refresh = refresh
	_updateLiveList(this);
}
function _updateLiveList(list){
	var inc = list._node._inc || list._node.ownerDocument._inc;
	if(list._inc != inc){
		var ls = list._refresh(list._node);
		//console.log(ls.length)
		__set__(list,'length',ls.length);
		copy(ls,list);
		list._inc = inc;
	}
}
LiveNodeList.prototype.item = function(i){
	_updateLiveList(this);
	return this[i];
}

_extends(LiveNodeList,NodeList);
/**
 * 
 * Objects implementing the NamedNodeMap interface are used to represent collections of nodes that can be accessed by name. Note that NamedNodeMap does not inherit from NodeList; NamedNodeMaps are not maintained in any particular order. Objects contained in an object implementing NamedNodeMap may also be accessed by an ordinal index, but this is simply to allow convenient enumeration of the contents of a NamedNodeMap, and does not imply that the DOM specifies an order to these Nodes.
 * NamedNodeMap objects in the DOM are live.
 * used for attributes or DocumentType entities 
 */
function NamedNodeMap() {
};

function _findNodeIndex(list,node){
	var i = list.length;
	while(i--){
		if(list[i] === node){return i}
	}
}

function _addNamedNode(el,list,newAttr,oldAttr){
	if(oldAttr){
		list[_findNodeIndex(list,oldAttr)] = newAttr;
	}else{
		list[list.length++] = newAttr;
	}
	if(el){
		newAttr.ownerElement = el;
		var doc = el.ownerDocument;
		if(doc){
			oldAttr && _onRemoveAttribute(doc,el,oldAttr);
			_onAddAttribute(doc,el,newAttr);
		}
	}
}
function _removeNamedNode(el,list,attr){
	var i = _findNodeIndex(list,attr);
	if(i>=0){
		var lastIndex = list.length-1
		while(i<lastIndex){
			list[i] = list[++i]
		}
		list.length = lastIndex;
		if(el){
			var doc = el.ownerDocument;
			if(doc){
				_onRemoveAttribute(doc,el,attr);
				attr.ownerElement = null;
			}
		}
	}else{
		throw DOMException(NOT_FOUND_ERR,new Error())
	}
}
NamedNodeMap.prototype = {
	length:0,
	item:NodeList.prototype.item,
	getNamedItem: function(key) {
//		if(key.indexOf(':')>0 || key == 'xmlns'){
//			return null;
//		}
		var i = this.length;
		while(i--){
			var attr = this[i];
			if(attr.nodeName == key){
				return attr;
			}
		}
	},
	setNamedItem: function(attr) {
		var el = attr.ownerElement;
		if(el && el!=this._ownerElement){
			throw new DOMException(INUSE_ATTRIBUTE_ERR);
		}
		var oldAttr = this.getNamedItem(attr.nodeName);
		_addNamedNode(this._ownerElement,this,attr,oldAttr);
		return oldAttr;
	},
	/* returns Node */
	setNamedItemNS: function(attr) {// raises: WRONG_DOCUMENT_ERR,NO_MODIFICATION_ALLOWED_ERR,INUSE_ATTRIBUTE_ERR
		var el = attr.ownerElement, oldAttr;
		if(el && el!=this._ownerElement){
			throw new DOMException(INUSE_ATTRIBUTE_ERR);
		}
		oldAttr = this.getNamedItemNS(attr.namespaceURI,attr.localName);
		_addNamedNode(this._ownerElement,this,attr,oldAttr);
		return oldAttr;
	},

	/* returns Node */
	removeNamedItem: function(key) {
		var attr = this.getNamedItem(key);
		_removeNamedNode(this._ownerElement,this,attr);
		return attr;
		
		
	},// raises: NOT_FOUND_ERR,NO_MODIFICATION_ALLOWED_ERR
	
	//for level2
	removeNamedItemNS:function(namespaceURI,localName){
		var attr = this.getNamedItemNS(namespaceURI,localName);
		_removeNamedNode(this._ownerElement,this,attr);
		return attr;
	},
	getNamedItemNS: function(namespaceURI, localName) {
		var i = this.length;
		while(i--){
			var node = this[i];
			if(node.localName == localName && node.namespaceURI == namespaceURI){
				return node;
			}
		}
		return null;
	}
};
/**
 * @see http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-102161490
 */
function DOMImplementation(/* Object */ features) {
	this._features = {};
	if (features) {
		for (var feature in features) {
			 this._features = features[feature];
		}
	}
};

DOMImplementation.prototype = {
	hasFeature: function(/* string */ feature, /* string */ version) {
		var versions = this._features[feature.toLowerCase()];
		if (versions && (!version || version in versions)) {
			return true;
		} else {
			return false;
		}
	},
	// Introduced in DOM Level 2:
	createDocument:function(namespaceURI,  qualifiedName, doctype){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR,WRONG_DOCUMENT_ERR
		var doc = new Document();
		doc.doctype = doctype;
		if(doctype){
			doc.appendChild(doctype);
		}
		doc.implementation = this;
		doc.childNodes = new NodeList();
		if(qualifiedName){
			var root = doc.createElementNS(namespaceURI,qualifiedName);
			doc.appendChild(root);
		}
		return doc;
	},
	// Introduced in DOM Level 2:
	createDocumentType:function(qualifiedName, publicId, systemId){// raises:INVALID_CHARACTER_ERR,NAMESPACE_ERR
		var node = new DocumentType();
		node.name = qualifiedName;
		node.nodeName = qualifiedName;
		node.publicId = publicId;
		node.systemId = systemId;
		// Introduced in DOM Level 2:
		//readonly attribute DOMString        internalSubset;
		
		//TODO:..
		//  readonly attribute NamedNodeMap     entities;
		//  readonly attribute NamedNodeMap     notations;
		return node;
	}
};


/**
 * @see http://www.w3.org/TR/2000/REC-DOM-Level-2-Core-20001113/core.html#ID-1950641247
 */

function Node() {
};

Node.prototype = {
	firstChild : null,
	lastChild : null,
	previousSibling : null,
	nextSibling : null,
	attributes : null,
	parentNode : null,
	childNodes : null,
	ownerDocument : null,
	nodeValue : null,
	namespaceURI : null,
	prefix : null,
	localName : null,
	// Modified in DOM Level 2:
	insertBefore:function(newChild, refChild){//raises 
		return _insertBefore(this,newChild,refChild);
	},
	replaceChild:function(newChild, oldChild){//raises 
		this.insertBefore(newChild,oldChild);
		if(oldChild){
			this.removeChild(oldChild);
		}
	},
	removeChild:function(oldChild){
		return _removeChild(this,oldChild);
	},
	appendChild:function(newChild){
		return this.insertBefore(newChild,null);
	},
	hasChildNodes:function(){
		return this.firstChild != null;
	},
	cloneNode:function(deep){
		return cloneNode(this.ownerDocument||this,this,deep);
	},
	// Modified in DOM Level 2:
	normalize:function(){
		var child = this.firstChild;
		while(child){
			var next = child.nextSibling;
			if(next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE){
				this.removeChild(next);
				child.appendData(next.data);
			}else{
				child.normalize();
				child = next;
			}
		}
	},
  	// Introduced in DOM Level 2:
	isSupported:function(feature, version){
		return this.ownerDocument.implementation.hasFeature(feature,version);
	},
    // Introduced in DOM Level 2:
    hasAttributes:function(){
    	return this.attributes.length>0;
    },
    lookupPrefix:function(namespaceURI){
    	var el = this;
    	while(el){
    		var map = el._nsMap;
    		//console.dir(map)
    		if(map){
    			for(var n in map){
    				if(map[n] == namespaceURI){
    					return n;
    				}
    			}
    		}
    		el = el.nodeType == 2?el.ownerDocument : el.parentNode;
    	}
    	return null;
    },
    // Introduced in DOM Level 3:
    lookupNamespaceURI:function(prefix){
    	var el = this;
    	while(el){
    		var map = el._nsMap;
    		//console.dir(map)
    		if(map){
    			if(prefix in map){
    				return map[prefix] ;
    			}
    		}
    		el = el.nodeType == 2?el.ownerDocument : el.parentNode;
    	}
    	return null;
    },
    // Introduced in DOM Level 3:
    isDefaultNamespace:function(namespaceURI){
    	var prefix = this.lookupPrefix(namespaceURI);
    	return prefix == null;
    }
};


function _xmlEncoder(c){
	return c == '<' && '&lt;' ||
         c == '>' && '&gt;' ||
         c == '&' && '&amp;' ||
         c == '"' && '&quot;' ||
         '&#'+c.charCodeAt()+';'
}


copy(NodeType,Node);
copy(NodeType,Node.prototype);

/**
 * @param callback return true for continue,false for break
 * @return boolean true: break visit;
 */
function _visitNode(node,callback){
	if(callback(node)){
		return true;
	}
	if(node = node.firstChild){
		do{
			if(_visitNode(node,callback)){return true}
        }while(node=node.nextSibling)
    }
}



function Document(){
}
function _onAddAttribute(doc,el,newAttr){
	doc && doc._inc++;
	var ns = newAttr.namespaceURI ;
	if(ns == 'http://www.w3.org/2000/xmlns/'){
		//update namespace
		el._nsMap[newAttr.prefix?newAttr.localName:''] = newAttr.value
	}
}
function _onRemoveAttribute(doc,el,newAttr,remove){
	doc && doc._inc++;
	var ns = newAttr.namespaceURI ;
	if(ns == 'http://www.w3.org/2000/xmlns/'){
		//update namespace
		delete el._nsMap[newAttr.prefix?newAttr.localName:'']
	}
}
function _onUpdateChild(doc,el,newChild){
	if(doc && doc._inc){
		doc._inc++;
		//update childNodes
		var cs = el.childNodes;
		if(newChild){
			cs[cs.length++] = newChild;
		}else{
			//console.log(1)
			var child = el.firstChild;
			var i = 0;
			while(child){
				cs[i++] = child;
				child =child.nextSibling;
			}
			cs.length = i;
		}
	}
}

/**
 * attributes;
 * children;
 * 
 * writeable properties:
 * nodeValue,Attr:value,CharacterData:data
 * prefix
 */
function _removeChild(parentNode,child){
	var previous = child.previousSibling;
	var next = child.nextSibling;
	if(previous){
		previous.nextSibling = next;
	}else{
		parentNode.firstChild = next
	}
	if(next){
		next.previousSibling = previous;
	}else{
		parentNode.lastChild = previous;
	}
	_onUpdateChild(parentNode.ownerDocument,parentNode);
	return child;
}
/**
 * preformance key(refChild == null)
 */
function _insertBefore(parentNode,newChild,nextChild){
	var cp = newChild.parentNode;
	if(cp){
		cp.removeChild(newChild);//remove and update
	}
	if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
		var newFirst = newChild.firstChild;
		if (newFirst == null) {
			return newChild;
		}
		var newLast = newChild.lastChild;
	}else{
		newFirst = newLast = newChild;
	}
	var pre = nextChild ? nextChild.previousSibling : parentNode.lastChild;

	newFirst.previousSibling = pre;
	newLast.nextSibling = nextChild;
	
	
	if(pre){
		pre.nextSibling = newFirst;
	}else{
		parentNode.firstChild = newFirst;
	}
	if(nextChild == null){
		parentNode.lastChild = newLast;
	}else{
		nextChild.previousSibling = newLast;
	}
	do{
		newFirst.parentNode = parentNode;
	}while(newFirst !== newLast && (newFirst= newFirst.nextSibling))
	_onUpdateChild(parentNode.ownerDocument||parentNode,parentNode);
	//console.log(parentNode.lastChild.nextSibling == null)
	if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
		newChild.firstChild = newChild.lastChild = null;
	}
	return newChild;
}
function _appendSingleChild(parentNode,newChild){
	var cp = newChild.parentNode;
	if(cp){
		var pre = parentNode.lastChild;
		cp.removeChild(newChild);//remove and update
		var pre = parentNode.lastChild;
	}
	var pre = parentNode.lastChild;
	newChild.parentNode = parentNode;
	newChild.previousSibling = pre;
	newChild.nextSibling = null;
	if(pre){
		pre.nextSibling = newChild;
	}else{
		parentNode.firstChild = newChild;
	}
	parentNode.lastChild = newChild;
	_onUpdateChild(parentNode.ownerDocument,parentNode,newChild);
	return newChild;
	//console.log("__aa",parentNode.lastChild.nextSibling == null)
}
Document.prototype = {
	//implementation : null,
	nodeName :  '#document',
	nodeType :  DOCUMENT_NODE,
	doctype :  null,
	documentElement :  null,
	_inc : 1,
	
	insertBefore :  function(newChild, refChild){//raises 
		if(newChild.nodeType == DOCUMENT_FRAGMENT_NODE){
			var child = newChild.firstChild;
			while(child){
				var next = child.nextSibling;
				this.insertBefore(child,refChild);
				child = next;
			}
			return newChild;
		}
		if(this.documentElement == null && newChild.nodeType == 1){
			this.documentElement = newChild;
		}
		
		return _insertBefore(this,newChild,refChild),(newChild.ownerDocument = this),newChild;
	},
	removeChild :  function(oldChild){
		if(this.documentElement == oldChild){
			this.documentElement = null;
		}
		return _removeChild(this,oldChild);
	},
	// Introduced in DOM Level 2:
	importNode : function(importedNode,deep){
		return importNode(this,importedNode,deep);
	},
	// Introduced in DOM Level 2:
	getElementById :	function(id){
		var rtv = null;
		_visitNode(this.documentElement,function(node){
			if(node.nodeType == 1){
				if(node.getAttribute('id') == id){
					rtv = node;
					return true;
				}
			}
		})
		return rtv;
	},
	
	//document factory method:
	createElement :	function(tagName){
		var node = new Element();
		node.ownerDocument = this;
		node.nodeName = tagName;
		node.tagName = tagName;
		node.childNodes = new NodeList();
		var attrs	= node.attributes = new NamedNodeMap();
		attrs._ownerElement = node;
		return node;
	},
	createDocumentFragment :	function(){
		var node = new DocumentFragment();
		node.ownerDocument = this;
		node.childNodes = new NodeList();
		return node;
	},
	createTextNode :	function(data){
		var node = new Text();
		node.ownerDocument = this;
		node.appendData(data)
		return node;
	},
	createComment :	function(data){
		var node = new Comment();
		node.ownerDocument = this;
		node.appendData(data)
		return node;
	},
	createCDATASection :	function(data){
		var node = new CDATASection();
		node.ownerDocument = this;
		node.appendData(data)
		return node;
	},
	createProcessingInstruction :	function(target,data){
		var node = new ProcessingInstruction();
		node.ownerDocument = this;
		node.tagName = node.target = target;
		node.nodeValue= node.data = data;
		return node;
	},
	createAttribute :	function(name){
		var node = new Attr();
		node.ownerDocument	= this;
		node.name = name;
		node.nodeName	= name;
		node.localName = name;
		node.specified = true;
		return node;
	},
	createEntityReference :	function(name){
		var node = new EntityReference();
		node.ownerDocument	= this;
		node.nodeName	= name;
		return node;
	},
	// Introduced in DOM Level 2:
	createElementNS :	function(namespaceURI,qualifiedName){
		var node = new Element();
		var pl = qualifiedName.split(':');
		var attrs	= node.attributes = new NamedNodeMap();
		node.childNodes = new NodeList();
		node.ownerDocument = this;
		node.nodeName = qualifiedName;
		node.tagName = qualifiedName;
		node.namespaceURI = namespaceURI;
		if(pl.length == 2){
			node.prefix = pl[0];
			node.localName = pl[1];
		}else{
			//el.prefix = null;
			node.localName = qualifiedName;
		}
		attrs._ownerElement = node;
		return node;
	},
	// Introduced in DOM Level 2:
	createAttributeNS :	function(namespaceURI,qualifiedName){
		var node = new Attr();
		var pl = qualifiedName.split(':');
		node.ownerDocument = this;
		node.nodeName = qualifiedName;
		node.name = qualifiedName;
		node.namespaceURI = namespaceURI;
		node.specified = true;
		if(pl.length == 2){
			node.prefix = pl[0];
			node.localName = pl[1];
		}else{
			//el.prefix = null;
			node.localName = qualifiedName;
		}
		return node;
	}
};
_extends(Document,Node);


function Element() {
	this._nsMap = {};
};
Element.prototype = {
	nodeType : ELEMENT_NODE,
	hasAttribute : function(name){
		return this.getAttributeNode(name)!=null;
	},
	getAttribute : function(name){
		var attr = this.getAttributeNode(name);
		return attr && attr.value || '';
	},
	getAttributeNode : function(name){
		return this.attributes.getNamedItem(name);
	},
	setAttribute : function(name, value){
		var attr = this.ownerDocument.createAttribute(name);
		attr.value = attr.nodeValue = "" + value;
		this.setAttributeNode(attr)
	},
	removeAttribute : function(name){
		var attr = this.getAttributeNode(name)
		attr && this.removeAttributeNode(attr);
	},
	
	//four real opeartion method
	appendChild:function(newChild){
		if(newChild.nodeType === DOCUMENT_FRAGMENT_NODE){
			return this.insertBefore(newChild,null);
		}else{
			return _appendSingleChild(this,newChild);
		}
	},
	setAttributeNode : function(newAttr){
		return this.attributes.setNamedItem(newAttr);
	},
	setAttributeNodeNS : function(newAttr){
		return this.attributes.setNamedItemNS(newAttr);
	},
	removeAttributeNode : function(oldAttr){
		return this.attributes.removeNamedItem(oldAttr.nodeName);
	},
	//get real attribute name,and remove it by removeAttributeNode
	removeAttributeNS : function(namespaceURI, localName){
		var old = this.getAttributeNodeNS(namespaceURI, localName);
		old && this.removeAttributeNode(old);
	},
	
	hasAttributeNS : function(namespaceURI, localName){
		return this.getAttributeNodeNS(namespaceURI, localName)!=null;
	},
	getAttributeNS : function(namespaceURI, localName){
		var attr = this.getAttributeNodeNS(namespaceURI, localName);
		return attr && attr.value || '';
	},
	setAttributeNS : function(namespaceURI, qualifiedName, value){
		var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
		attr.value = attr.nodeValue = value;
		this.setAttributeNode(attr)
	},
	getAttributeNodeNS : function(namespaceURI, localName){
		return this.attributes.getNamedItemNS(namespaceURI, localName);
	},
	
	getElementsByTagName : function(tagName){
		return new LiveNodeList(this,function(base){
			var ls = [];
			_visitNode(base,function(node){
				if(node !== base && node.nodeType == ELEMENT_NODE && (tagName === '*' || node.tagName == tagName)){
					ls.push(node);
				}
			});
			return ls;
		});
	},
	getElementsByTagNameNS : function(namespaceURI, localName){
		return new LiveNodeList(this,function(base){
			var ls = [];
			_visitNode(base,function(node){
				if(node !== base && node.nodeType === ELEMENT_NODE && node.namespaceURI === namespaceURI && (localName === '*' || node.localName == localName)){
					ls.push(node);
				}
			});
			return ls;
		});
	}
};
Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;


_extends(Element,Node);
function Attr() {
};
Attr.prototype.nodeType = ATTRIBUTE_NODE;
_extends(Attr,Node);


function CharacterData() {
};
CharacterData.prototype = {
	data : '',
	substringData : function(offset, count) {
		return this.data.substring(offset, offset+count);
	},
	appendData: function(text) {
		text = this.data+text;
		this.nodeValue = this.data = text;
		this.length = text.length;
	},
	insertData: function(offset,text) {
		this.replaceData(offset,0,text);
	
	},
	appendChild:function(newChild){
		//if(!(newChild instanceof CharacterData)){
			throw new Error(ExceptionMessage[3])
		//}
		return Node.prototype.appendChild.apply(this,arguments)
	},
	deleteData: function(offset, count) {
		this.replaceData(offset,count,"");
	},
	replaceData: function(offset, count, text) {
		var start = this.data.substring(0,offset);
		var end = this.data.substring(offset+count);
		text = start + text + end;
		this.nodeValue = this.data = text;
		this.length = text.length;
	}
}
_extends(CharacterData,Node);
function Text() {
};
Text.prototype = {
	nodeName : "#text",
	nodeType : TEXT_NODE,
	splitText : function(offset) {
		var text = this.data;
		var newText = text.substring(offset);
		text = text.substring(0, offset);
		this.data = this.nodeValue = text;
		this.length = text.length;
		var newNode = this.ownerDocument.createTextNode(newText);
		if(this.parentNode){
			this.parentNode.insertBefore(newNode, this.nextSibling);
		}
		return newNode;
	}
}
_extends(Text,CharacterData);
function Comment() {
};
Comment.prototype = {
	nodeName : "#comment",
	nodeType : COMMENT_NODE
}
_extends(Comment,CharacterData);

function CDATASection() {
};
CDATASection.prototype = {
	nodeName : "#cdata-section",
	nodeType : CDATA_SECTION_NODE
}
_extends(CDATASection,CharacterData);


function DocumentType() {
};
DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
_extends(DocumentType,Node);

function Notation() {
};
Notation.prototype.nodeType = NOTATION_NODE;
_extends(Notation,Node);

function Entity() {
};
Entity.prototype.nodeType = ENTITY_NODE;
_extends(Entity,Node);

function EntityReference() {
};
EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
_extends(EntityReference,Node);

function DocumentFragment() {
};
DocumentFragment.prototype.nodeName =	"#document-fragment";
DocumentFragment.prototype.nodeType =	DOCUMENT_FRAGMENT_NODE;
_extends(DocumentFragment,Node);


function ProcessingInstruction() {
}
ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
_extends(ProcessingInstruction,Node);
function XMLSerializer(){}
XMLSerializer.prototype.serializeToString = function(node){
	var buf = [];
	serializeToString(node,buf);
	return buf.join('');
}
Node.prototype.toString =function(){
	return XMLSerializer.prototype.serializeToString(this);
}
function serializeToString(node,buf){
	switch(node.nodeType){
	case ELEMENT_NODE:
		var attrs = node.attributes;
		var len = attrs.length;
		var child = node.firstChild;
		var nodeName = node.tagName;
		var isHTML = htmlns === node.namespaceURI
		buf.push('<',nodeName);
		for(var i=0;i<len;i++){
			serializeToString(attrs.item(i),buf,isHTML);
		}
		if(child || isHTML && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)){
			buf.push('>');
			//if is cdata child node
			if(isHTML && /^script$/i.test(nodeName)){
				if(child){
					buf.push(child.data);
				}
			}else{
				while(child){
					serializeToString(child,buf);
					child = child.nextSibling;
				}
			}
			buf.push('</',nodeName,'>');
		}else{
			buf.push('/>');
		}
		return;
	case DOCUMENT_NODE:
	case DOCUMENT_FRAGMENT_NODE:
		var child = node.firstChild;
		while(child){
			serializeToString(child,buf);
			child = child.nextSibling;
		}
		return;
	case ATTRIBUTE_NODE:
		return buf.push(' ',node.name,'="',node.value.replace(/[<&"]/g,_xmlEncoder),'"');
	case TEXT_NODE:
		return buf.push(node.data.replace(/[<&]/g,_xmlEncoder));
	case CDATA_SECTION_NODE:
		return buf.push( '<![CDATA[',node.data,']]>');
	case COMMENT_NODE:
		return buf.push( "<!--",node.data,"-->");
	case DOCUMENT_TYPE_NODE:
		var pubid = node.publicId;
		var sysid = node.systemId;
		buf.push('<!DOCTYPE ',node.name);
		if(pubid){
			buf.push(' PUBLIC "',pubid);
			if (sysid && sysid!='.') {
				buf.push( '" "',sysid);
			}
			buf.push('">');
		}else if(sysid && sysid!='.'){
			buf.push(' SYSTEM "',sysid,'">');
		}else{
			var sub = node.internalSubset;
			if(sub){
				buf.push(" [",sub,"]");
			}
			buf.push(">");
		}
		return;
	case PROCESSING_INSTRUCTION_NODE:
		return buf.push( "<?",node.target," ",node.data,"?>");
	case ENTITY_REFERENCE_NODE:
		return buf.push( '&',node.nodeName,';');
	//case ENTITY_NODE:
	//case NOTATION_NODE:
	default:
		buf.push('??',node.nodeName);
	}
}
function importNode(doc,node,deep){
	var node2;
	switch (node.nodeType) {
	case ELEMENT_NODE:
		node2 = node.cloneNode(false);
		node2.ownerDocument = doc;
		//var attrs = node2.attributes;
		//var len = attrs.length;
		//for(var i=0;i<len;i++){
			//node2.setAttributeNodeNS(importNode(doc,attrs.item(i),deep));
		//}
	case DOCUMENT_FRAGMENT_NODE:
		break;
	case ATTRIBUTE_NODE:
		deep = true;
		break;
	//case ENTITY_REFERENCE_NODE:
	//case PROCESSING_INSTRUCTION_NODE:
	////case TEXT_NODE:
	//case CDATA_SECTION_NODE:
	//case COMMENT_NODE:
	//	deep = false;
	//	break;
	//case DOCUMENT_NODE:
	//case DOCUMENT_TYPE_NODE:
	//cannot be imported.
	//case ENTITY_NODE:
	//case NOTATION_NODE：
	//can not hit in level3
	//default:throw e;
	}
	if(!node2){
		node2 = node.cloneNode(false);//false
	}
	node2.ownerDocument = doc;
	node2.parentNode = null;
	if(deep){
		var child = node.firstChild;
		while(child){
			node2.appendChild(importNode(doc,child,deep));
			child = child.nextSibling;
		}
	}
	return node2;
}
//
//var _relationMap = {firstChild:1,lastChild:1,previousSibling:1,nextSibling:1,
//					attributes:1,childNodes:1,parentNode:1,documentElement:1,doctype,};
function cloneNode(doc,node,deep){
	var node2 = new node.constructor();
	for(var n in node){
		var v = node[n];
		if(typeof v != 'object' ){
			if(v != node2[n]){
				node2[n] = v;
			}
		}
	}
	if(node.childNodes){
		node2.childNodes = new NodeList();
	}
	node2.ownerDocument = doc;
	switch (node2.nodeType) {
	case ELEMENT_NODE:
		var attrs	= node.attributes;
		var attrs2	= node2.attributes = new NamedNodeMap();
		var len = attrs.length
		attrs2._ownerElement = node2;
		for(var i=0;i<len;i++){
			node2.setAttributeNode(cloneNode(doc,attrs.item(i),true));
		}
		break;;
	case ATTRIBUTE_NODE:
		deep = true;
	}
	if(deep){
		var child = node.firstChild;
		while(child){
			node2.appendChild(cloneNode(doc,child,deep));
			child = child.nextSibling;
		}
	}
	return node2;
}

function __set__(object,key,value){
	object[key] = value
}
//do dynamic
try{
	if(Object.defineProperty){
		Object.defineProperty(LiveNodeList.prototype,'length',{
			get:function(){
				_updateLiveList(this);
				return this.$$length;
			}
		});
		Object.defineProperty(Node.prototype,'textContent',{
			get:function(){
				return getTextContent(this);
			},
			set:function(data){
				switch(this.nodeType){
				case 1:
				case 11:
					while(this.firstChild){
						this.removeChild(this.firstChild);
					}
					if(data || String(data)){
						this.appendChild(this.ownerDocument.createTextNode(data));
					}
					break;
				default:
					//TODO:
					this.data = data;
					this.value = value;
					this.nodeValue = data;
				}
			}
		})
		
		function getTextContent(node){
			switch(node.nodeType){
			case 1:
			case 11:
				var buf = [];
				node = node.firstChild;
				while(node){
					if(node.nodeType!==7 && node.nodeType !==8){
						buf.push(getTextContent(node));
					}
					node = node.nextSibling;
				}
				return buf.join('');
			default:
				return node.nodeValue;
			}
		}
		__set__ = function(object,key,value){
			//console.log(value)
			object['$$'+key] = value
		}
	}
}catch(e){//ie8
}

if(typeof require == 'function'){
	exports.DOMImplementation = DOMImplementation;
	exports.XMLSerializer = XMLSerializer;
}

},{}],5:[function(require,module,exports){
//[4]   	NameStartChar	   ::=   	":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
//[4a]   	NameChar	   ::=   	NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
//[5]   	Name	   ::=   	NameStartChar (NameChar)*
var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]///\u10000-\uEFFFF
var nameChar = new RegExp("[\\-\\.0-9"+nameStartChar.source.slice(1,-1)+"\u00B7\u0300-\u036F\\ux203F-\u2040]");
var tagNamePattern = new RegExp('^'+nameStartChar.source+nameChar.source+'*(?:\:'+nameStartChar.source+nameChar.source+'*)?$');
//var tagNamePattern = /^[a-zA-Z_][\w\-\.]*(?:\:[a-zA-Z_][\w\-\.]*)?$/
//var handlers = 'resolveEntity,getExternalSubset,characters,endDocument,endElement,endPrefixMapping,ignorableWhitespace,processingInstruction,setDocumentLocator,skippedEntity,startDocument,startElement,startPrefixMapping,notationDecl,unparsedEntityDecl,error,fatalError,warning,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,comment,endCDATA,endDTD,endEntity,startCDATA,startDTD,startEntity'.split(',')

//S_TAG,	S_ATTR,	S_EQ,	S_V
//S_ATTR_S,	S_E,	S_S,	S_C
var S_TAG = 0;//tag name offerring
var S_ATTR = 1;//attr name offerring 
var S_ATTR_S=2;//attr name end and space offer
var S_EQ = 3;//=space?
var S_V = 4;//attr value(no quot value only)
var S_E = 5;//attr value end and no space(quot end)
var S_S = 6;//(attr value end || tag end ) && (space offer)
var S_C = 7;//closed el<el />

function XMLReader(){
	
}

XMLReader.prototype = {
	parse:function(source,defaultNSMap,entityMap){
		var domBuilder = this.domBuilder;
		domBuilder.startDocument();
		_copy(defaultNSMap ,defaultNSMap = {})
		parse(source,defaultNSMap,entityMap,
				domBuilder,this.errorHandler);
		domBuilder.endDocument();
	}
}
function parse(source,defaultNSMapCopy,entityMap,domBuilder,errorHandler){
  function fixedFromCharCode(code) {
		// String.prototype.fromCharCode does not supports
		// > 2 bytes unicode chars directly
		if (code > 0xffff) {
			code -= 0x10000;
			var surrogate1 = 0xd800 + (code >> 10)
				, surrogate2 = 0xdc00 + (code & 0x3ff);

			return String.fromCharCode(surrogate1, surrogate2);
		} else {
			return String.fromCharCode(code);
		}
	}
	function entityReplacer(a){
		var k = a.slice(1,-1);
		if(k in entityMap){
			return entityMap[k]; 
		}else if(k.charAt(0) === '#'){
			return fixedFromCharCode(parseInt(k.substr(1).replace('x','0x')))
		}else{
			errorHandler.error('entity not found:'+a);
			return a;
		}
	}
	function appendText(end){//has some bugs
		var xt = source.substring(start,end).replace(/&#?\w+;/g,entityReplacer);
		locator&&position(start);
		domBuilder.characters(xt,0,end-start);
		start = end
	}
	function position(start,m){
		while(start>=endPos && (m = linePattern.exec(source))){
			startPos = m.index;
			endPos = startPos + m[0].length;
			locator.lineNumber++;
			//console.log('line++:',locator,startPos,endPos)
		}
		locator.columnNumber = start-startPos+1;
	}
	var startPos = 0;
	var endPos = 0;
	var linePattern = /.+(?:\r\n?|\n)|.*$/g
	var locator = domBuilder.locator;
	
	var parseStack = [{currentNSMap:defaultNSMapCopy}]
	var closeMap = {};
	var start = 0;
	while(true){
		var i = source.indexOf('<',start);
		if(i<0){
			if(!source.substr(start).match(/^\s*$/)){
				var doc = domBuilder.document;
    			var text = doc.createTextNode(source.substr(start));
    			doc.appendChild(text);
    			domBuilder.currentElement = text;
			}
			return;
		}
		if(i>start){
			appendText(i);
		}
		switch(source.charAt(i+1)){
		case '/':
			var end = source.indexOf('>',i+3);
			var tagName = source.substring(i+2,end);
			var config = parseStack.pop();
			var localNSMap = config.localNSMap;
			
	        if(config.tagName != tagName){
	            errorHandler.fatalError("end tag name: "+tagName+' is not match the current start tagName:'+config.tagName );
	        }
			domBuilder.endElement(config.uri,config.localName,tagName);
			if(localNSMap){
				for(var prefix in localNSMap){
					domBuilder.endPrefixMapping(prefix) ;
				}
			}
			end++;
			break;
			// end elment
		case '?':// <?...?>
			locator&&position(i);
			end = parseInstruction(source,i,domBuilder);
			break;
		case '!':// <!doctype,<![CDATA,<!--
			locator&&position(i);
			end = parseDCC(source,i,domBuilder,errorHandler);
			break;
		default:
			try{
				locator&&position(i);
				
				var el = new ElementAttributes();
				
				//elStartEnd
				var end = parseElementStartPart(source,i,el,entityReplacer,errorHandler);
				var len = el.length;
				//position fixed
				if(len && locator){
					var backup = copyLocator(locator,{});
					for(var i = 0;i<len;i++){
						var a = el[i];
						position(a.offset);
						a.offset = copyLocator(locator,{});
					}
					copyLocator(backup,locator);
				}
				if(!el.closed && fixSelfClosed(source,end,el.tagName,closeMap)){
					el.closed = true;
					if(!entityMap.nbsp){
						errorHandler.warning('unclosed xml attribute');
					}
				}
				appendElement(el,domBuilder,parseStack);
				
				
				if(el.uri === 'http://www.w3.org/1999/xhtml' && !el.closed){
					end = parseHtmlSpecialContent(source,end,el.tagName,entityReplacer,domBuilder)
				}else{
					end++;
				}
			}catch(e){
				errorHandler.error('element parse error: '+e);
				end = -1;
			}

		}
		if(end<0){
			//TODO: 这里有可能sax回退，有位置错误风险
			appendText(i+1);
		}else{
			start = end;
		}
	}
}
function copyLocator(f,t){
	t.lineNumber = f.lineNumber;
	t.columnNumber = f.columnNumber;
	return t;
	
}

/**
 * @see #appendElement(source,elStartEnd,el,selfClosed,entityReplacer,domBuilder,parseStack);
 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
 */
function parseElementStartPart(source,start,el,entityReplacer,errorHandler){
	var attrName;
	var value;
	var p = ++start;
	var s = S_TAG;//status
	while(true){
		var c = source.charAt(p);
		switch(c){
		case '=':
			if(s === S_ATTR){//attrName
				attrName = source.slice(start,p);
				s = S_EQ;
			}else if(s === S_ATTR_S){
				s = S_EQ;
			}else{
				//fatalError: equal must after attrName or space after attrName
				throw new Error('attribute equal must after attrName');
			}
			break;
		case '\'':
		case '"':
			if(s === S_EQ){//equal
				start = p+1;
				p = source.indexOf(c,start)
				if(p>0){
					value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
					el.add(attrName,value,start-1);
					s = S_E;
				}else{
					//fatalError: no end quot match
					throw new Error('attribute value no end \''+c+'\' match');
				}
			}else if(s == S_V){
				value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
				//console.log(attrName,value,start,p)
				el.add(attrName,value,start);
				//console.dir(el)
				errorHandler.warning('attribute "'+attrName+'" missed start quot('+c+')!!');
				start = p+1;
				s = S_E
			}else{
				//fatalError: no equal before
				throw new Error('attribute value must after "="');
			}
			break;
		case '/':
			switch(s){
			case S_TAG:
				el.setTagName(source.slice(start,p));
			case S_E:
			case S_S:
			case S_C:
				s = S_C;
				el.closed = true;
			case S_V:
			case S_ATTR:
			case S_ATTR_S:
				break;
			//case S_EQ:
			default:
				throw new Error("attribute invalid close char('/')")
			}
			break;
		case ''://end document
			//throw new Error('unexpected end of input')
			errorHandler.error('unexpected end of input');
		case '>':
			switch(s){
			case S_TAG:
				el.setTagName(source.slice(start,p));
			case S_E:
			case S_S:
			case S_C:
				break;//normal
			case S_V://Compatible state
			case S_ATTR:
				value = source.slice(start,p);
				if(value.slice(-1) === '/'){
					el.closed  = true;
					value = value.slice(0,-1)
				}
			case S_ATTR_S:
				if(s === S_ATTR_S){
					value = attrName;
				}
				if(s == S_V){
					errorHandler.warning('attribute "'+value+'" missed quot(")!!');
					el.add(attrName,value.replace(/&#?\w+;/g,entityReplacer),start)
				}else{
					errorHandler.warning('attribute "'+value+'" missed value!! "'+value+'" instead!!')
					el.add(value,value,start)
				}
				break;
			case S_EQ:
				throw new Error('attribute value missed!!');
			}
//			console.log(tagName,tagNamePattern,tagNamePattern.test(tagName))
			return p;
		/*xml space '\x20' | #x9 | #xD | #xA; */
		case '\u0080':
			c = ' ';
		default:
			if(c<= ' '){//space
				switch(s){
				case S_TAG:
					el.setTagName(source.slice(start,p));//tagName
					s = S_S;
					break;
				case S_ATTR:
					attrName = source.slice(start,p)
					s = S_ATTR_S;
					break;
				case S_V:
					var value = source.slice(start,p).replace(/&#?\w+;/g,entityReplacer);
					errorHandler.warning('attribute "'+value+'" missed quot(")!!');
					el.add(attrName,value,start)
				case S_E:
					s = S_S;
					break;
				//case S_S:
				//case S_EQ:
				//case S_ATTR_S:
				//	void();break;
				//case S_C:
					//ignore warning
				}
			}else{//not space
//S_TAG,	S_ATTR,	S_EQ,	S_V
//S_ATTR_S,	S_E,	S_S,	S_C
				switch(s){
				//case S_TAG:void();break;
				//case S_ATTR:void();break;
				//case S_V:void();break;
				case S_ATTR_S:
					errorHandler.warning('attribute "'+attrName+'" missed value!! "'+attrName+'" instead!!')
					el.add(attrName,attrName,start);
					start = p;
					s = S_ATTR;
					break;
				case S_E:
					errorHandler.warning('attribute space is required"'+attrName+'"!!')
				case S_S:
					s = S_ATTR;
					start = p;
					break;
				case S_EQ:
					s = S_V;
					start = p;
					break;
				case S_C:
					throw new Error("elements closed character '/' and '>' must be connected to");
				}
			}
		}
		p++;
	}
}
/**
 * @return end of the elementStartPart(end of elementEndPart for selfClosed el)
 */
function appendElement(el,domBuilder,parseStack){
	var tagName = el.tagName;
	var localNSMap = null;
	var currentNSMap = parseStack[parseStack.length-1].currentNSMap;
	var i = el.length;
	while(i--){
		var a = el[i];
		var qName = a.qName;
		var value = a.value;
		var nsp = qName.indexOf(':');
		if(nsp>0){
			var prefix = a.prefix = qName.slice(0,nsp);
			var localName = qName.slice(nsp+1);
			var nsPrefix = prefix === 'xmlns' && localName
		}else{
			localName = qName;
			prefix = null
			nsPrefix = qName === 'xmlns' && ''
		}
		//can not set prefix,because prefix !== ''
		a.localName = localName ;
		//prefix == null for no ns prefix attribute 
		if(nsPrefix !== false){//hack!!
			if(localNSMap == null){
				localNSMap = {}
				//console.log(currentNSMap,0)
				_copy(currentNSMap,currentNSMap={})
				//console.log(currentNSMap,1)
			}
			currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
			a.uri = 'http://www.w3.org/2000/xmlns/'
			domBuilder.startPrefixMapping(nsPrefix, value) 
		}
	}
	var i = el.length;
	while(i--){
		a = el[i];
		var prefix = a.prefix;
		if(prefix){//no prefix attribute has no namespace
			if(prefix === 'xml'){
				a.uri = 'http://www.w3.org/XML/1998/namespace';
			}if(prefix !== 'xmlns'){
				a.uri = currentNSMap[prefix]
				
				//{console.log('###'+a.qName,domBuilder.locator.systemId+'',currentNSMap,a.uri)}
			}
		}
	}
	var nsp = tagName.indexOf(':');
	if(nsp>0){
		prefix = el.prefix = tagName.slice(0,nsp);
		localName = el.localName = tagName.slice(nsp+1);
	}else{
		prefix = null;//important!!
		localName = el.localName = tagName;
	}
	//no prefix element has default namespace
	var ns = el.uri = currentNSMap[prefix || ''];
	domBuilder.startElement(ns,localName,tagName,el);
	//endPrefixMapping and startPrefixMapping have not any help for dom builder
	//localNSMap = null
	if(el.closed){
		domBuilder.endElement(ns,localName,tagName);
		if(localNSMap){
			for(prefix in localNSMap){
				domBuilder.endPrefixMapping(prefix) 
			}
		}
	}else{
		el.currentNSMap = currentNSMap;
		el.localNSMap = localNSMap;
		parseStack.push(el);
	}
}
function parseHtmlSpecialContent(source,elStartEnd,tagName,entityReplacer,domBuilder){
	if(/^(?:script|textarea)$/i.test(tagName)){
		var elEndStart =  source.indexOf('</'+tagName+'>',elStartEnd);
		var text = source.substring(elStartEnd+1,elEndStart);
		if(/[&<]/.test(text)){
			if(/^script$/i.test(tagName)){
				//if(!/\]\]>/.test(text)){
					//lexHandler.startCDATA();
					domBuilder.characters(text,0,text.length);
					//lexHandler.endCDATA();
					return elEndStart;
				//}
			}//}else{//text area
				text = text.replace(/&#?\w+;/g,entityReplacer);
				domBuilder.characters(text,0,text.length);
				return elEndStart;
			//}
			
		}
	}
	return elStartEnd+1;
}
function fixSelfClosed(source,elStartEnd,tagName,closeMap){
	//if(tagName in closeMap){
	var pos = closeMap[tagName];
	if(pos == null){
		//console.log(tagName)
		pos = closeMap[tagName] = source.lastIndexOf('</'+tagName+'>')
	}
	return pos<elStartEnd;
	//} 
}
function _copy(source,target){
	for(var n in source){target[n] = source[n]}
}
function parseDCC(source,start,domBuilder,errorHandler){//sure start with '<!'
	var next= source.charAt(start+2)
	switch(next){
	case '-':
		if(source.charAt(start + 3) === '-'){
			var end = source.indexOf('-->',start+4);
			//append comment source.substring(4,end)//<!--
			if(end>start){
				domBuilder.comment(source,start+4,end-start-4);
				return end+3;
			}else{
				errorHandler.error("Unclosed comment");
				return -1;
			}
		}else{
			//error
			return -1;
		}
	default:
		if(source.substr(start+3,6) == 'CDATA['){
			var end = source.indexOf(']]>',start+9);
			domBuilder.startCDATA();
			domBuilder.characters(source,start+9,end-start-9);
			domBuilder.endCDATA() 
			return end+3;
		}
		//<!DOCTYPE
		//startDTD(java.lang.String name, java.lang.String publicId, java.lang.String systemId) 
		var matchs = split(source,start);
		var len = matchs.length;
		if(len>1 && /!doctype/i.test(matchs[0][0])){
			var name = matchs[1][0];
			var pubid = len>3 && /^public$/i.test(matchs[2][0]) && matchs[3][0]
			var sysid = len>4 && matchs[4][0];
			var lastMatch = matchs[len-1]
			domBuilder.startDTD(name,pubid && pubid.replace(/^(['"])(.*?)\1$/,'$2'),
					sysid && sysid.replace(/^(['"])(.*?)\1$/,'$2'));
			domBuilder.endDTD();
			
			return lastMatch.index+lastMatch[0].length
		}
	}
	return -1;
}



function parseInstruction(source,start,domBuilder){
	var end = source.indexOf('?>',start);
	if(end){
		var match = source.substring(start,end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
		if(match){
			var len = match[0].length;
			domBuilder.processingInstruction(match[1], match[2]) ;
			return end+2;
		}else{//error
			return -1;
		}
	}
	return -1;
}

/**
 * @param source
 */
function ElementAttributes(source){
	
}
ElementAttributes.prototype = {
	setTagName:function(tagName){
		if(!tagNamePattern.test(tagName)){
			throw new Error('invalid tagName:'+tagName)
		}
		this.tagName = tagName
	},
	add:function(qName,value,offset){
		if(!tagNamePattern.test(qName)){
			throw new Error('invalid attribute:'+qName)
		}
		this[this.length++] = {qName:qName,value:value,offset:offset}
	},
	length:0,
	getLocalName:function(i){return this[i].localName},
	getOffset:function(i){return this[i].offset},
	getQName:function(i){return this[i].qName},
	getURI:function(i){return this[i].uri},
	getValue:function(i){return this[i].value}
//	,getIndex:function(uri, localName)){
//		if(localName){
//			
//		}else{
//			var qName = uri
//		}
//	},
//	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
//	getType:function(uri,localName){}
//	getType:function(i){},
}




function _set_proto_(thiz,parent){
	thiz.__proto__ = parent;
	return thiz;
}
if(!(_set_proto_({},_set_proto_.prototype) instanceof _set_proto_)){
	_set_proto_ = function(thiz,parent){
		function p(){};
		p.prototype = parent;
		p = new p();
		for(parent in thiz){
			p[parent] = thiz[parent];
		}
		return p;
	}
}

function split(source,start){
	var match;
	var buf = [];
	var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
	reg.lastIndex = start;
	reg.exec(source);//skip <
	while(match = reg.exec(source)){
		buf.push(match);
		if(match[1])return buf;
	}
}

if(typeof require == 'function'){
	exports.XMLReader = XMLReader;
}


},{}],6:[function(require,module,exports){
// Draw objects to the canvas

'use strict';

var Color = require('../objects/color');

var vg = {};

// Return true if an object can be drawn using the `g.draw` function.
vg.isDrawable = function (o) {
    if (Array.isArray(o)) {
        o = o[0];
    }
    if (!o) {
        return false;
    } else if (typeof o.draw === 'function') {
        return true;
    } else if (o.x !== undefined && o.y !== undefined) {
        return true;
    } else if (o.r !== undefined && o.g !== undefined && o.b !== undefined) {
        return true;
    } else {
        return false;
    }
};

vg.drawPoints = function (ctx, points) {
    var pt, i;
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    for (i = 0; i < points.length; i += 1) {
        pt = points[i];
        ctx.moveTo(pt.x, pt.y);
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2, false);
    }
    ctx.fill();
};

vg.drawColoredPoints = function (ctx, points) {
    for (var i = 0, n = points.length; i < n; i += 1) {
        var pt = points[i];
        ctx.fillStyle = Color.toCSS(pt);
        ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
    }
};

vg.drawRectangles = function (ctx, rectangles) {
    var i, r;
    ctx.save();
    for (i = 0; i < rectangles.length; i += 1) {
        r = rectangles[i];
        ctx.strokeStyle = 'black';
        ctx.strokeWidth = 1;
        ctx.rect(r.x, r.y, r.width, r.height);
        ctx.stroke();
    }
    ctx.restore();
};

vg.drawColors = function (ctx, colors) {
    var i, c;
    ctx.save();
    for (i = 0; i < colors.length; i += 1) {
        c = colors[i];
        ctx.fillStyle = Color.toCSS(c);
        ctx.fillRect(0, 0, 30, 30);
        ctx.translate(30, 0);
    }
    ctx.restore();
};

vg.draw = function (ctx, o) {
    var k = o;
    var isArray = false;
    if (Array.isArray(o)) {
        k = o[0];
        isArray = true;
    }

    if (k) {
        if (typeof k.draw === 'function') {
            if (isArray) {
                for (var i = 0, n = o.length; i < n; i += 1) {
                    vg.draw(ctx, o[i]);
                }
            } else {
                o.draw(ctx);
            }
        } else if (k.x !== undefined && k.y !== undefined) {
            if (k.r !== undefined && k.g !== undefined && k.b !== undefined) {
                vg.drawColoredPoints(ctx, isArray ? o : [o]);
            } else if (k.width !== undefined && k.height !== undefined) {
                vg.drawRectangles(ctx, isArray ? o : [o]);
            } else {
                vg.drawPoints(ctx, isArray ? o : [o]);
            }
        } else if (k.r !== undefined && k.g !== undefined && k.b !== undefined) {
            vg.drawColors(ctx, isArray ? o : [o]);
        }
    }
};

vg.toSVG = function (o, options) {
    options = options || {};
    var includeHeader = options.header === true;
    var x = options.x !== undefined ? options.x : 0;
    var y = options.y !== undefined ? options.y : 0;
    var width = options.width !== undefined ? options.width : 500;
    var height = options.height !== undefined ? options.height : 500;
    var svg = '';
    if (o) {
        if (typeof o.toSVG === 'function') {
            svg = o.toSVG();
        } else if (Array.isArray(o)) {
            svg = '<g>\n';
            for (var i = 0, n = o.length; i < n; i += 1) {
                svg += vg.toSVG(o[i]) + '\n';
            }
            svg += '</g>\n';
        }
    }
    if (includeHeader) {
        svg = '<?xml version="1.0" encoding="utf-8"?>' +
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
            'x="' + x + '" y="' + y + '" width="' + width + 'px" height="' + height + 'px"' +
            ' viewBox="' + x + ' ' + y + ' ' + width + ' ' + height + '">\n' +
            svg +
            '</svg>\n';
    }
    return svg;
};

module.exports = vg;

},{"../objects/color":9}],7:[function(require,module,exports){
// Object creation / manipulation commands

'use strict';

var _ = require('lodash');
var ClipperLib = require('js-clipper');
var bezier = require('../util/bezier');
var geo = require('../util/geo');
var math = require('../util/math');
var random = require('../util/random');

var Color = require('../objects/color');
var Group = require('../objects/group');
var Path = require('../objects/path');
var Point = require('../objects/point');
var Rect = require('../objects/rect');
var Transform = require('../objects/transform');
var Transformable = require('../objects/transformable');

function _cloneCommand(cmd) {
    var newCmd = {type: cmd.type};
    if (newCmd.type !== bezier.CLOSE) {
        newCmd.x = cmd.x;
        newCmd.y = cmd.y;
    }
    if (newCmd.type === bezier.QUADTO) {
        newCmd.x1 = cmd.x1;
        newCmd.y1 = cmd.y1;
    } else if (newCmd.type === bezier.CURVETO) {
        newCmd.x1 = cmd.x1;
        newCmd.y1 = cmd.y1;
        newCmd.x2 = cmd.x2;
        newCmd.y2 = cmd.y2;
    }
    return newCmd;
}

var vg = {};

vg.HORIZONTAL = 'horizontal';
vg.VERTICAL = 'vertical';

vg.EAST = 'e';
vg.WEST = 'w';
vg.NORTH = 'n';
vg.SOUTH = 's';

vg.bounds = function (o) {
    var r, i, n;
    if (!o) {
        return new Rect();
    } else if (typeof o.bounds === 'function') {
        return o.bounds();
    } else if (o.x !== undefined && o.y !== undefined) {
        if (o.width !== undefined && o.height !== undefined) {
            return new Rect(o.x, o.y, o.width, o.height);
        } else {
            return new Rect(o.x, o.y, 0, 0);
        }
    } else if (o.r !== undefined && o.g !== undefined && o.b !== undefined) {
        return new vg.Rect(0, 0, 30, 30);
    } else if (Array.isArray(o)) {
        r = null;
        n = o.length;
        // A color array is special since the colors have no inherent position.
        if (n > 0 && o[0].r !== undefined && o[0].g !== undefined && o[0].b !== undefined) {
            return new Rect(0, 0, o.length * 30, 30);
        }
        for (i = 0; i < n; i += 1) {
            if (!r) {
                r = vg.bounds(o[i]);
            } else {
                r = r.unite(vg.bounds(o[i]));
            }
        }
        return r || new Rect();
    } else {
        return new Rect();
    }
};

vg.makeCenteredRect = function (cx, cy, width, height) {
    var x = cx - width / 2,
        y = cy - height / 2;
    return new Rect(x, y, width, height);
};

vg.makePoint = function (x, y) {
    return new Point(x, y);
};

vg.makeRect = function (x, y, width, height) {
    return new Rect(x, y, width, height);
};

// Combine all given shape arguments into a new group.
// This function works like makeGroup, except that this can take any number
// of arguments.
vg.merge = function () {
    return new Group(_.reject(_.flatten(arguments, true), _.isEmpty));
};

vg.combinePaths = function (shape) {
    return Path.combine(shape);
};

vg.shapePoints = vg.toPoints = function (shape) {
    if (!shape) {
        return [];
    }
    if (shape.commands) {
        return _.map(_.filter(shape.commands, function (cmd) { if (cmd.x !== undefined) { return true; } return false; }), function (cmd) { return new Point(cmd.x, cmd.y); });
    }
    var i, points = [];
    for (i = 0; i < shape.shapes.length; i += 1) {
        points = points.concat(vg.shapePoints(shape.shapes[i]));
    }
    return points;
};

// FILTERS //////////////////////////////////////////////////////////////

vg.colorize = function (shape, fill, stroke, strokeWidth) {
    if (!shape) {
        return;
    }
    return shape.colorize(fill, stroke, strokeWidth);
};

vg.translate = function (shape, position) {
    if (shape.translate) {
        return shape.translate(position);
    }
    return Transformable.translate.apply(shape, [position]);
};

vg.scale = function (shape, scale, origin) {
    if (shape.scale) {
        return shape.scale(scale, origin);
    }
    return Transformable.scale.apply(shape, [scale, origin]);
};

vg.rotate = function (shape, angle, origin) {
    if (shape.rotate) {
        return shape.rotate(angle, origin);
    }
    return Transformable.rotate.apply(shape, [angle, origin]);
};

vg.skew = function (shape, skew, origin) {
    if (shape.skew) {
        return shape.skew(skew, origin);
    }
    return Transformable.skew.apply(shape, [skew, origin]);
};

vg.copy = function (shape, copies, order, translate, rotate, scale) {
    var i, t, j, op,
        shapes = [],
        tx = 0,
        ty = 0,
        r = 0,
        sx = 1.0,
        sy = 1.0;
    for (i = 0; i < copies; i += 1) {
        t = new Transform();
        for (j = 0; j < order.length; j += 1) {
            op = order[j];
            if (op === 't') {
                t = t.translate(tx, ty);
            } else if (op === 'r') {
                t = t.rotate(r);
            } else if (op === 's') {
                t = t.scale(sx, sy);
            }
        }
        if (Array.isArray(shape) && shape.length > 0 && shape[0].x !== undefined && shape[0].y !== undefined) {
            shapes = shapes.concat(t.transformShape(shape));
        } else {
            shapes.push(t.transformShape(shape));
        }

        tx += translate.x;
        ty += translate.y;
        r += rotate;
        sx += scale.x;
        sy += scale.y;
    }
    return shapes;
};

vg.fit = function (shape, position, width, height, stretch) {
    if (!shape) {
        return;
    }
    stretch = stretch !== undefined ? stretch : false;
    var t, sx, sy,
        bounds = vg.bounds(shape),
        bx = bounds.x,
        by = bounds.y,
        bw = bounds.width,
        bh = bounds.height;

    // Make sure bw and bh aren't infinitely small numbers.
    // This will lead to incorrect transformations with for examples lines.
    bw = (bw > 0.000000000001) ? bw : 0;
    bh = (bh > 0.000000000001) ? bh : 0;

    t = new Transform();
    t = t.translate(position.x, position.y);

    if (!stretch) {
        // don't scale widths or heights that are equal to zero.
        sx = (bw > 0) ? (width / bw) : Number.MAX_VALUE;
        sy = (bh > 0) ? (height / bh) : Number.MAX_VALUE;
        sx = sy = Math.min(sx, sy);
    } else {
        sx = (bw > 0) ? (width / bw) : 1;
        sy = (bh > 0) ? (height / bh) : 1;
    }

    t = t.scale(sx, sy);
    t = t.translate(-bw / 2 - bx, -bh / 2 - by);

    return t.transformShape(shape);
};

// Fit the given shape to the bounding shape.
// If stretch = true, proportions will be distorted.
vg.fitTo = function (shape, bounding, stretch) {
    if (!shape) {
        return;
    }
    if (!bounding) {
        return;
    }

    var bounds = vg.bounds(bounding),
        bx = bounds.x,
        by = bounds.y,
        bw = bounds.width,
        bh = bounds.height;

    return vg.fit(shape, {x: bx + bw / 2, y: by + bh / 2}, bw, bh, stretch);
};

vg.mirror = function (shape, angle, origin, keepOriginal) {
    if (!shape) {
        return;
    }
    origin = origin || new Point();
    if (angle !== 0) {
        angle = angle || 90;
    }

    var f = function (x, y) {
        var d = geo.distance(x, y, origin.x, origin.y),
            a = geo.angle(x, y, origin.x, origin.y),
            pt = geo.coordinates(origin.x, origin.y, 180 + angle, d * Math.cos(math.radians(a - angle)));
        d = geo.distance(x, y, pt.x, pt.y);
        a = geo.angle(x, y, pt.x, pt.y);
        pt = geo.coordinates(x, y, a, d * 2);
        return new Point(pt.x, pt.y);
    };

    var mirrorPath = function (path) {
        var pt, ctrl1, ctrl2;
        var p = new Path([], path.fill, path.stroke, path.strokeWidth);
        for (var i = 0; i < path.commands.length; i += 1) {
            var cmd = path.commands[i];
            if (cmd.type === bezier.MOVETO) {
                pt = f(cmd.x, cmd.y);
                p.moveTo(pt.x, pt.y);
            } else if (cmd.type === bezier.LINETO) {
                pt = f(cmd.x, cmd.y);
                p.lineTo(pt.x, pt.y);
            } else if (cmd.type === bezier.CURVETO) {
                pt = f(cmd.x, cmd.y);
                ctrl1 = f(cmd.x1, cmd.y1);
                ctrl2 = f(cmd.x2, cmd.y2);
                p.curveTo(ctrl1.x, ctrl1.y, ctrl2.x, ctrl2.y, pt.x, pt.y);
            } else if (cmd.type === bezier.CLOSE) {
                p.close();
            } else {
                throw new Error('Unknown command ' + cmd);
            }
        }
        return p;
    };

    var mirrorPoints = function (points) {
        return _.map(points, function (point) {
            return f(point.x, point.y);
        });
    };

    var mirrorGroup = function (group) {
        var shapes = _.map(group.shapes, function (shape) {
            return mirror(shape);
        });
        return new Group(shapes);
    };

    var mirror = function (shape) {
        if (Array.isArray(shape) && shape.length > 0 && shape[0].x !== undefined && shape[0].y !== undefined) {
            return mirrorPoints(shape);
        }
        var fn = (shape.shapes) ? mirrorGroup : mirrorPath;
        return fn(shape);
    };

    var newShape = mirror(shape);

    if (keepOriginal) {
        if (Array.isArray(shape) && shape.length > 0 && shape[0].x !== undefined && shape[0].y !== undefined) {
            return shape.concat(newShape);
        }
        return new Group([shape, newShape]);
    } else {
        return newShape;
    }
};

vg.pathLength = function (shape, options) {
    var precision = 20;
    if (options && options.precision) {
        precision = options.precision;
    }
    return shape.length(precision);
};

vg.resampleByLength = function (shape, maxLength) {
    if (!shape) { return; }
    return shape.resampleByLength(maxLength);
};

vg.resampleByAmount = function (shape, amount, perContour) {
    if (!shape) { return; }
    return shape.resampleByAmount(amount, perContour);
};

vg.wigglePoints = function (shape, offset, seed) {
    seed = seed !== undefined ? seed : Math.random();
    var rand = random.generator(seed);
    if (offset === undefined) {
        offset = {x: 10, y: 10};
    } else if (typeof offset === 'number') {
        offset = {x: offset, y: offset};
    }
    var wigglePoints = function (shape) {
        var i, dx, dy;
        if (shape.commands) {
            var p = new Path([], shape.fill, shape.stroke, shape.strokeWidth);
            for (i = 0; i < shape.commands.length; i += 1) {
                dx = (rand(0, 1) - 0.5) * offset.x * 2;
                dy = (rand(0, 1) - 0.5) * offset.y * 2;
                var cmd = shape.commands[i];
                if (cmd.type === bezier.MOVETO) {
                    p.moveTo(cmd.x + dx, cmd.y + dy);
                } else if (cmd.type === bezier.LINETO) {
                    p.lineTo(cmd.x + dx, cmd.y + dy);
                } else if (cmd.type === bezier.CURVETO) {
                    p.curveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x + dx, cmd.y + dy);
                } else if (cmd.type === bezier.CLOSE) {
                    p.close();
                }
            }
            return p;
        } else if (shape.shapes) {
            return new Group(_.map(shape.shapes, wigglePoints));
        } else if (Array.isArray(shape) && shape.length > 0 && shape[0].x !== undefined && shape[0].y !== undefined){
            var points = [];
            for (i = 0; i < shape.length; i += 1) {
                dx = (rand(0, 1) - 0.5) * offset.x * 2;
                dy = (rand(0, 1) - 0.5) * offset.y * 2;
                points.push(new Point(shape[i].x + dx, shape[i].y + dy));
            }
            return points;
        } else {
            return _.map(shape, wigglePoints);
        }
    };
    return wigglePoints(shape);
};

vg.wiggleContours = function (shape, offset, seed) {
    seed = seed !== undefined ? seed : Math.random();
    var rand = random.generator(seed);
    if (offset === undefined) {
        offset = {x: 10, y: 10};
    } else if (typeof offset === 'number') {
        offset = {x: offset, y: offset};
    }
    var wiggleContours = function (shape) {
        if (shape.commands) {
            var i, dx, dy, t,
                subPaths = shape.contours(),
                commands = [];
            for (i = 0; i < subPaths.length; i += 1) {
                dx = (rand(0, 1) - 0.5) * offset.x * 2;
                dy = (rand(0, 1) - 0.5) * offset.y * 2;
                t = new Transform().translate(dx, dy);
                commands = commands.concat(t.transformShape(new Path(subPaths[i])).commands);
            }
            return new Path(commands, shape.fill, shape.stroke, shape.strokeWidth);
        } else if (shape.shapes) {
            return new Group(_.map(shape.shapes, wiggleContours));
        } else {
            return _.map(shape, wiggleContours);
        }
    };
    return wiggleContours(shape);
};

vg.wigglePaths = function (shape, offset, seed) {
    seed = seed !== undefined ? seed : Math.random();
    var rand = random.generator(seed);
    if (offset === undefined) {
        offset = {x: 10, y: 10};
    } else if (typeof offset === 'number') {
        offset = {x: offset, y: offset};
    }

    var wigglePaths = function (shape) {
        if (shape.commands) {
            return shape;
        } else if (shape.shapes) {
            return new Group(wigglePaths(shape.shapes));
        } else if (Array.isArray(shape)) {
            var subShape, dx, dy, t, newShapes = [];
            for (var i = 0; i < shape.length; i += 1) {
                subShape = shape[i];
                if (subShape.commands) {
                    dx = (rand(0, 1) - 0.5) * offset.x * 2;
                    dy = (rand(0, 1) - 0.5) * offset.y * 2;
                    t = new Transform().translate(dx, dy);
                    newShapes.push(t.transformShape(subShape));
                } else if (subShape.shapes) {
                    newShapes.push(wigglePaths(subShape));
                }
            }
            return newShapes;
        }
    };

    return wigglePaths(shape);
};

vg.scatterPoints = function (shape, amount, seed) {
    // Generate points within the boundaries of a shape.
    if (!shape) {
        return;
    }
    seed = seed !== undefined ? seed : Math.random();
    var i, j, tries, x, y,
        rand = random.generator(seed),
        bounds = shape.bounds(),
        bx = bounds.x,
        by = bounds.y,
        bw = bounds.width,
        bh = bounds.height,
        contours = shape.contours(),
        paths = [],
        points = [];

    for (i = 0; i < contours.length; i++) {
        var contourPath = new Path(contours[i]);
        var nrKeypoints = contourPath.commands.length;
        var POINTS_PER_SEGMENT = 5;
        paths.push(contourPath.points(nrKeypoints * POINTS_PER_SEGMENT, {closed: true } ));
    }

    for (i = 0; i < amount; i += 1) {
        tries = 100;
        while (tries > 0) {
            var inContourCount = 0;
            x = bx + rand(0, 1) * bw;
            y = by + rand(0, 1) * bh;
            for (j = 0; j < paths.length; j++) {
                if (geo.pointInPolygon(paths[j], x, y)) {
                    inContourCount += 1;
                }
            }
            if (inContourCount % 2) {
                points.push(new Point(x, y));
                break;
            }
            tries -= 1;
        }
    }
    return points;
};

vg.connectPoints = function (points, closed) {
    if (!points) {
        return;
    }
    var p = new Path();
    for (var i = 0; i < points.length; i += 1) {
        var pt = points[i];
        if (i === 0) {
            p.moveTo(pt.x, pt.y);
        } else {
            p.lineTo(pt.x, pt.y);
        }
    }
    if (closed) {
        p.close();
    }
    p.fill = null;
    p.stroke = Color.BLACK;
    return p;
};

vg.align = function (shape, position, hAlign, vAlign) {
    if (!shape) {
        return;
    }
    var dx, dy, t,
        x = position.x,
        y = position.y,
        bounds = vg.bounds(shape);
    if (hAlign === 'left') {
        dx = x - bounds.x;
    } else if (hAlign === 'right') {
        dx = x - bounds.x - bounds.width;
    } else if (hAlign === 'center') {
        dx = x - bounds.x - bounds.width / 2;
    } else {
        dx = 0;
    }
    if (vAlign === 'top') {
        dy = y - bounds.y;
    } else if (vAlign === 'bottom') {
        dy = y - bounds.y - bounds.height;
    } else if (vAlign === 'middle') {
        dy = y - bounds.y - bounds.height / 2;
    } else {
        dy = 0;
    }

    t = new Transform().translate(dx, dy);
    return t.transformShape(shape);
};

// Snap geometry to a grid.
vg.snap = function (shape, distance, strength, center) {
    if (!shape) {
        return;
    }
    strength = strength !== undefined ? strength : 1;
    center = center || Point.ZERO;

    var snapShape = function (shape) {
        if (shape.commands) {
            var p = new Path([], shape.fill, shape.stroke, shape.strokeWidth);
            for (var i = 0; i < shape.commands.length; i += 1) {
                var cmd = shape.commands[i];
                if (cmd.type === bezier.MOVETO || cmd.type === bezier.LINETO || cmd.type === bezier.CURVETO) {
                    var x = math.snap(cmd.x + center.x, distance, strength) - center.x;
                    var y = math.snap(cmd.y + center.y, distance, strength) - center.y;
                    if (cmd.type === bezier.MOVETO) {
                        p.moveTo(x, y);
                    } else if (cmd.type === bezier.LINETO) {
                        p.lineTo(x, y);
                    } else if (cmd.type === bezier.CURVETO) {
                        var x1 = math.snap(cmd.x1 + center.x, distance, strength) - center.x;
                        var y1 = math.snap(cmd.y1 + center.y, distance, strength) - center.y;
                        var x2 = math.snap(cmd.x2 + center.x, distance, strength) - center.x;
                        var y2 = math.snap(cmd.y2 + center.y, distance, strength) - center.y;
                        p.curveTo(x1, y1, x2, y2, x, y);
                    }
                } else if (cmd.type === bezier.CLOSE) {
                    p.close();
                } else {
                    throw new Error('Invalid path command ' + cmd);
                }
            }
            return p;
        } else if (shape.shapes) {
            return new Group(_.map(shape.shapes, snapShape));
        } else if (Array.isArray(shape) && shape.length > 0 && shape[0].x !== undefined && shape[0].y !== undefined) {
            return _.map(shape, function (point) {
                var x = math.snap(point.x + center.x, distance, strength) - center.x;
                var y = math.snap(point.y + center.y, distance, strength) - center.y;
                return new Point(x, y);
            });
        } else {
            return _.map(shape, snapShape);
        }
    };

    return snapShape(shape);
};

vg.deletePoints = function (shape, bounding, invert) {
    var deletePoints = function (shape) {
        var i, cmd, commands = [];
        var pt, points = [];
        if (shape.commands) {
            var newCurve = true;
            for (i = 0; i < shape.commands.length; i += 1) {
                cmd = _cloneCommand(shape.commands[i]);
                if (cmd.x === undefined ||
                        (invert && bounding.contains(cmd.x, cmd.y)) ||
                        (!invert && !bounding.contains(cmd.x, cmd.y))) {
                    if (newCurve && cmd.type !== bezier.MOVETO) {
                        cmd.type = bezier.MOVETO;
                    }
                    commands.push(cmd);
                    if (cmd.type === bezier.MOVETO) {
                        newCurve = false;
                    } else if (cmd.type === bezier.CLOSE) {
                        newCurve = true;
                    }
                }
            }
            return new Path(commands, shape.fill, shape.stroke, shape.strokeWidth);
        } else if (shape.shapes) {
            return new Group(_.map(shape.shapes, deletePoints));
        } else if (Array.isArray(shape) && shape.length > 0 && shape[0].x !== undefined && shape[0].y !== undefined){
            for (i = 0; i < shape.length; i += 1) {
                pt = shape[i];
                if ((invert && bounding.contains(pt.x, pt.y)) ||
                   (!invert && !bounding.contains(pt.x, pt.y))) {
                    points.push(_cloneCommand(pt));
                }
            }
            return points;
        } else {
            return _.map(shape, deletePoints);
        }
    };

    return deletePoints(shape);
};

vg.deletePaths = function (shape, bounding, invert) {
    var deletePaths = function (shape) {
        if (shape.commands) {
            return null;
        } else if (shape.shapes) {
            return new Group(deletePaths(shape.shapes));
        } else if (Array.isArray(shape)) {
            var j, s, selected, cmd, subShapes, newShapes = [];
            var shapes = shape;
            for (var i = 0; i < shapes.length; i += 1) {
                s = shapes[i];
                if (s.commands) {
                    selected = false;
                    for (j = 0; j < s.commands.length; j += 1) {
                        cmd = s.commands[j];
                        if (cmd.x !== undefined && bounding.contains(cmd.x, cmd.y)) {
                            selected = true;
                            break;
                        }
                    }
                    if (!((invert && !selected) || (selected && !invert))) {
                        newShapes.push(s);
                    }
                } else if (s.shapes) {
                    subShapes = deletePaths(s);
                    if (subShapes.length !== 0) {
                        newShapes.push(subShapes);
                    }
                }
            }
            return newShapes;
        }
    };

    return deletePaths(shape);
};

vg['delete'] = function (shape, bounding, scope, invert) {
    if (shape === null || bounding === null) { return null; }
    if (scope === 'points') { return vg.deletePoints(shape, bounding, invert); }
    if (scope === 'paths') { return vg.deletePaths(shape, bounding, invert); }
    throw new Error('Invalid scope.');
};

vg.pointOnPath = function (shape, t) {
    if (!shape) {
        return;
    }
    if (shape.shapes) {
        shape = new Path(vg.combinePaths(shape));
    }
    t = t % 1;
    if (t < 0) {
        t = 1 + t;
    }
    var pt = shape.point(t);
    return new Point(pt.x, pt.y);
};

/*vg.shapeOnPath = function (shapes, path, amount, alignment, spacing, margin, baselineOffset) {
    if (!shapes) { return []; }
    if (path === null) { return []; }

    if (alignment === 'trailing') {
        shapes = shapes.slice();
        shapes.reverse();
    }

    var i, pos, p1, p2, a, t,
        length = path.length() - margin,
        m = margin / path.length(),
        c = 0,
        newShapes = [];

    function putOnPath(shape) {
        if (alignment === 'distributed') {
            var p = length / ((amount * shapes.length) - 1);
            pos = c * p / length;
            pos = m + (pos * (1 - 2 * m));
        } else {
            pos = ((c * spacing) % length) / length;
            pos = m + (pos * (1 - m));

            if (alignment === 'trailing') {
                pos = 1 - pos;
            }
        }

        p1 = path.point(pos);
        p2 = path.point(pos + 0.0000001);
        a = geo.angle(p1.x, p1.y, p2.x, p2.y);
        if (baselineOffset) {
            p1 = geo.coordinates(p1.x, p1.y, a - 90, baselineOffset);
        }
        t = new Transform();
        t = t.translate(p1.x, p1.y);
        t = t.rotate(a);
        newShapes.push(t.transformShape(shape));
        c += 1;
    }

    for (i = 0; i < amount; i += 1) {
        _.each(shapes, putOnPath);
    }
    return newShapes;
};*/

vg._x = function (shape) {
    if (shape.x !== undefined) {
        return shape.x;
    } else {
        return shape.bounds().x;
    }
};

vg._y = function (shape) {
    if (shape.y !== undefined) {
        return shape.y;
    } else {
        return shape.bounds().y;
    }
};

vg._angleToPoint = function (point) {
    return function (shape) {
        if (shape.x !== undefined && shape.y !== undefined) {
            return geo.angle(shape.x, shape.y, point.x, point.y);
        } else {
            var centerPoint = shape.bounds().centerPoint();
            return geo.angle(centerPoint.x, centerPoint.y, point.x, point.y);
        }
    };
};

vg._distanceToPoint = function (point) {
    return function (shape) {
        if (shape.x !== undefined && shape.y !== undefined) {
            return geo.distance(shape.x, shape.y, point.x, point.y);
        } else {
            var centerPoint = shape.bounds().centerPoint();
            return geo.distance(centerPoint.x, centerPoint.y, point.x, point.y);
        }
    };
};

vg.shapeSort = function (shapes, method, origin) {
    if (!shapes) {
        return;
    }
    origin = origin || Point.ZERO;

    var methods = {
        x: vg._x,
        y: vg._y,
        angle: vg._angleToPoint(origin),
        distance: vg._distanceToPoint(origin)
    };
    method = methods[method];
    if (method === undefined) { return shapes; }
    var newShapes = shapes.slice(0);
    newShapes.sort(function (a, b) {
        var _a = method(a),
            _b = method(b);
        if (_a < _b) { return -1; }
        if (_a > _b) { return 1; }
        return 0;
    });
    return newShapes;
};

vg.group = function () {
    return new Group(_.flatten(arguments));
};

vg.ungroup = function (shape) {
    if (!shape) {
        return [];
    } else if (shape.shapes) {
        var i, s, shapes = [];
        for (i = 0; i < shape.shapes.length; i += 1) {
            s = shape.shapes[i];
            if (s.commands) {
                shapes.push(s);
            } else if (s.shapes) {
                shapes = shapes.concat(vg.ungroup(s));
            }
        }
        return shapes;
    } else if (shape.commands) {
        return [shape];
    } else {
        return [];
    }
};

vg.centerPoint = function (shape) {
    if (!shape) {
        return Point.ZERO;
    }
    var r = vg.bounds(shape);
    return new Point(r.x + r.width / 2, r.y + r.height / 2);
};

vg.link = function (shape1, shape2, orientation) {
    if (!shape1 || !shape2) {
        return;
    }

    var p = new Path();
    var a = shape1.bounds();
    var b = shape2.bounds();
    if (orientation === vg.HORIZONTAL) {
        var hw = (b.x - (a.x + a.width)) / 2;
        p.moveTo(a.x + a.width, a.y);
        p.curveTo(a.x + a.width + hw, a.y, b.x - hw, b.y, b.x, b.y);
        p.lineTo(b.x, b.y + b.height);
        p.curveTo(b.x - hw, b.y + b.height, a.x + a.width + hw, a.y + a.height, a.x + a.width, a.y + a.height);
        p.close();
    } else {
        var hh = (b.y - (a.y + a.height)) / 2;
        p.moveTo(a.x, a.y + a.height);
        p.curveTo(a.x, a.y + a.height + hh, b.x, b.y - hh, b.x, b.y);
        p.lineTo(b.x + b.width, b.y);
        p.curveTo(b.x + b.width, b.y - hh, a.x + a.width, a.y + a.height + hh, a.x + a.width, a.y + a.height);
        p.close();
    }
    return p;
};

vg.stack = function (shapes, direction, margin) {
    if (!shapes) {
        return [];
    }
    if (shapes.length <= 1) {
        return shapes;
    }
    var tx, ty, t, bounds,
        firstBounds = shapes[0].bounds(),
        newShapes = [];
    margin = margin || 0;
    if (direction === vg.EAST) {
        tx = -(firstBounds.width / 2);
        _.each(shapes, function (shape) {
            bounds = shape.bounds();
            t = new Transform().translate(tx - bounds.x, 0);
            newShapes.push(t.transformShape(shape));
            tx += bounds.width + margin;
        });
    } else if (direction === vg.WEST) {
        tx = firstBounds.width / 2;
        _.each(shapes, function (shape) {
            bounds = shape.bounds();
            t = new Transform().translate(tx + bounds.x, 0);
            newShapes.push(t.transformShape(shape));
            tx -= bounds.width + margin;
        });
    } else if (direction === vg.NORTH) {
        ty = firstBounds.height / 2;
        _.each(shapes, function (shape) {
            bounds = shape.bounds();
            t = new Transform().translate(0, ty + bounds.y);
            newShapes.push(t.transformShape(shape));
            ty -= bounds.height + margin;
        });
    } else if (direction === vg.SOUTH) {
        ty = -(firstBounds.height / 2);
        _.each(shapes, function (shape) {
            bounds = shape.bounds();
            t = new Transform().translate(0, ty - bounds.y);
            newShapes.push(t.transformShape(shape));
            ty += bounds.height + margin;
        });
    }
    return newShapes;
};

vg.compound = function (shape1, shape2, method) {
    var methods = {
        'union': ClipperLib.ClipType.ctUnion,
        'difference': ClipperLib.ClipType.ctDifference,
        'intersection': ClipperLib.ClipType.ctIntersection,
        'xor': ClipperLib.ClipType.ctXor
    };

    function toPoints(shape) {
        var l1 = [];
        var i, l, s, j, pt;
        for (i = 0; i < shape.length; i += 1) {
            l = [];
            s = shape[i];
            for (j = 0; j < s.length; j += 1) {
                pt = s[j];
                if (pt.type !== bezier.CLOSE) {
                    l.push({X: pt.x, Y: pt.y});
                }
            }
            l1.push(l);
        }
        return l1;
    }

    if (!shape1.commands) { shape1 = Path.combine(shape1); }
    if (!shape2.commands) { shape2 = Path.combine(shape2); }
    var contours1 = shape1.resampleByLength(1).contours();
    var contours2 = shape2.resampleByLength(1).contours();

    var subjPaths = toPoints(contours1);
    var clipPaths = toPoints(contours2);
    var scale = 100;
    ClipperLib.JS.ScaleUpPaths(subjPaths, scale);
    ClipperLib.JS.ScaleUpPaths(clipPaths, scale);

    var cpr = new ClipperLib.Clipper();
    cpr.AddPaths(subjPaths, ClipperLib.PolyType.ptSubject, shape1.isClosed());
    cpr.AddPaths(clipPaths, ClipperLib.PolyType.ptClip, shape2.isClosed());

    var solutionPaths = new ClipperLib.Paths();
    cpr.Execute(methods[method], solutionPaths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
    solutionPaths = ClipperLib.JS.Clean(solutionPaths, 0.1 * scale);
    ClipperLib.JS.ScaleDownPaths(solutionPaths, scale);
    var path = new Path();
    var i, j, s;
    for (i = 0; i < solutionPaths.length; i += 1) {
        s = solutionPaths[i];
        for (j = 0; j < s.length ; j += 1) {
            if (j === 0) {
                path.moveTo(s[j].X, s[j].Y);
            } else {
                path.lineTo(s[j].X, s[j].Y);
            }
        }
        if (s[0].X !== s[s.length-1].X || s[0].Y !== s[s.length-1].Y) {
            path.closePath();
        }
    }
    return path;
};

module.exports = vg;

},{"../objects/color":9,"../objects/group":10,"../objects/path":12,"../objects/point":13,"../objects/rect":14,"../objects/transform":16,"../objects/transformable":17,"../util/bezier":19,"../util/geo":21,"../util/math":23,"../util/random":24,"js-clipper":1,"lodash":2}],8:[function(require,module,exports){
// Basic shapes

'use strict';

var _ = require('lodash');

var geo = require('../util/geo');

var Color = require('../objects/color');
var Path = require('../objects/path');
var Point = require('../objects/point');
var gText = require('../objects/text');

var vg = {};

vg.roundedRect = function (cx, cy, width, height, rx, ry) {
    var p = new Path();
    p.addRoundedRect(cx, cy, width, height, rx, ry);
    return p;
};

vg.quad = function (pt1, pt2, pt3, pt4) {
    var args = arguments;
    var p = new Path();
    if (args.length === 8) {
        Path.prototype.addQuad.apply(p, args);
    } else {
        pt1 = Point.read(pt1);
        pt2 = Point.read(pt2);
        pt3 = Point.read(pt3);
        pt4 = Point.read(pt4);
        p.addQuad(pt1.x, pt1.y, pt2.x, pt2.y, pt3.x, pt3.y, pt4.x, pt4.y);
    }
    return p;
};

vg.rect = function (position, width, height, roundness) {
    var args = arguments;
    if (args.length === 3) {
        position = Point.read(position);
    } else if (args.length === 4) {
        if (typeof args[0] === 'number' && typeof args[1] === 'number') {
            position = Point.read(args[0], args[1]);
            width = args[2];
            height = args[3];
            roundness = null;
        } else {
            position = Point.read(position);
            roundness = Point.read(roundness);
        }
    } else if (args.length === 5 || args.length === 6) {
        position = Point.read(args[0], args[1]);
        width = args[2];
        height = args[3];
        if (args.length === 5 && typeof args[4] === 'number') {
            roundness = Point.read(args[4], args[4]);
        } else {
            roundness = Point.read(args[4], args[5]);
        }
    }

    if (!roundness || (roundness.x === 0 && roundness.y === 0)) {
        var p = new Path();
        p.addRect(position.x - width / 2, position.y - height / 2, width, height);
        return p;
    } else {
        return vg.roundedRect(position.x - width / 2, position.y - height / 2, width, height, roundness.x, roundness.y);
    }
};

vg.ellipse = function (position, width, height) {
    var args = arguments;
    if (args.length === 4) {
        position = Point.read(args[0], args[1]);
        width = args[2];
        height = args[3];
    } else {
        position = Point.read(position);
    }
    var p = new Path();
    p.addEllipse(position.x - width / 2, position.y - height / 2, width, height);
    return p;
};

vg.line = function (point1, point2) {
    var args = arguments;
    if (args.length === 4) {
        point1 = Point.read(args[0], args[1]);
        point2 = Point.read(args[2], args[3]);
    } else {
        point1 = Point.read(point1);
        point2 = Point.read(point2);
    }
    var line = new Path();
    line.addLine(point1.x, point1.y, point2.x, point2.y);
    line.fill = null;
    line.stroke = 'black';
    return line;
};

vg.lineAngle = function (point, angle, distance) {
    var args = arguments;
    if (args.length === 4) {
        point = Point.read(args[0], args[1]);
        distance = args[2];
        angle = args[3];
    } else {
        point = Point.read(point);
    }
    var point2 = geo.coordinates(point.x, point.y, angle, distance);
    return vg.line(point, point2);
};

vg.arc = function (position, width, height, startAngle, degrees, arcType) {
    var args = arguments;
    if (args.length === 7) {
        position = Point.read(args[0], args[1]);
        width = args[2];
        height = args[3];
        startAngle = args[4];
        degrees = args[5];
        arcType = args[6];
    } else {
        position = Point.read(position);
    }
    var p = new Path();
    p.addArc(position.x, position.y, width, height, startAngle, degrees, arcType);
    return p;
};

vg.curve = function (pt1, pt2, t, distance) {
    var args = arguments;
    if (args.length === 6) {
        pt1 = Point.read(args[0], args[1]);
        pt2 = Point.read(args[2], args[3]);
        t = args[4];
        distance = args[5];
    } else {
        pt1 = Point.read(pt1);
        pt2 = Point.read(pt2);
    }

    var cx = pt1.x + t * (pt2.x - pt1.x),
        cy = pt1.y + t * (pt2.y - pt1.y),
        a = geo.angle(pt1.x, pt1.y, pt2.x, pt2.y) + 90,
        q = geo.coordinates(cx, cy, a, distance),
        qx = q.x,
        qy = q.y,

        c1x = pt1.x + 2 / 3.0 * (qx - pt1.x),
        c1y = pt1.y + 2 / 3.0 * (qy - pt1.y),
        c2x = pt2.x + 2 / 3.0 * (qx - pt2.x),
        c2y = pt2.y + 2 / 3.0 * (qy - pt2.y);

    var p = new Path();
    p.moveTo(pt1.x, pt1.y);
    p.curveTo(c1x, c1y, c2x, c2y, pt2.x, pt2.y);
    p.fill = null;
    p.stroke = Color.BLACK;
    return p;
};

vg.polygon = function (position, radius, sides, align) {
    var args = arguments;
    if (args.length === 5 || (args.length === 4 && typeof args[0] === 'number' && typeof args[1] === 'number')) {
        position = Point.read(args[0], args[1]);
        radius = args[2];
        sides = args[3];
        align = args.length === 5 ? args[4] : true;
    } else {
        position = Point.read(position);
        if (args.length === 3) {
            align = true;
        }
    }
    sides = Math.max(sides, 3);
    var c0, c1, i, c,
        x = position.x,
        y = position.y,
        r = radius,
        a = 360.0 / sides,
        da = 0;
    if (align === true) {
        c0 = geo.coordinates(x, y, 0, r);
        c1 = geo.coordinates(x, y, a, r);
        da = -geo.angle(c1.x, c1.y, c0.x, c0.y);
    }
    var p = new Path();
    for (i = 0; i < sides; i += 1) {
        c = geo.coordinates(x, y, (a * i) + da, r);
        if (i === 0) {
            p.moveTo(c.x, c.y);
        } else {
            p.lineTo(c.x, c.y);
        }
    }
    p.close();
    return p;
};

vg.star = function (position, points, outer, inner) {
    var args = arguments;
    if (args.length === 5 || (args.length === 4 && typeof args[0] === 'number' && typeof args[1] === 'number')) {
        position = Point.read(args[0], args[1]);
        points = args[2];
        outer = args[3];
        inner = args[4];
    } else {
        position = Point.read(position);
    }
    if (!inner) { inner = outer; }
    var i, angle, radius, x, y;
    var p = new Path();
    p.moveTo(position.x, position.y + outer / 2);
    // Calculate the points of the star.
    for (i = 1; i < points * 2; i += 1) {
        angle = i * Math.PI / points;
        radius = (i % 2 === 1) ? inner / 2 : outer / 2;
        x = position.x + radius * Math.sin(angle);
        y = position.y + radius * Math.cos(angle);
        p.lineTo(x, y);
    }
    p.close();
    return p;
};

vg.freehand = function (pathString) {
    var i, j, values,
        nonEmpty = function (s) { return s !== ''; },
        contours = _.filter(pathString.split('M'), nonEmpty);

    contours = _.map(contours, function (c) { return c.replace(/,/g, ' '); });
    var p = new Path();
    for (j = 0; j < contours.length; j += 1) {
        values = _.filter(contours[j].split(' '), nonEmpty);
        for (i = 0; i < values.length; i += 2) {
            if (values[i + 1] !== undefined) {
                var x = parseFloat(values[i]);
                var y = parseFloat(values[i + 1]);
                if (i === 0) {
                    p.moveTo(x, y);
                } else {
                    p.lineTo(x, y);
                }
            }
        }
    }
    p.fill = null;
    p.stroke = Color.BLACK;
    return p;
};

// Create a grid of points.
vg.grid = function (columns, rows, columnWidth, rowHeight, position) {
    var gridWidth, left, gridHeight, top, rowIndex, colIndex, x, y, i,
        points = [];
    points.length = columns * rows;
    position = position !== undefined ? position : Point.ZERO;
    if (columns > 1) {
        gridWidth = columnWidth * (columns - 1);
        left = position.x - gridWidth / 2;
    } else {
        left = position.x;
    }
    if (rows > 1) {
        gridHeight = rowHeight * (rows - 1);
        top = position.y - gridHeight / 2;
    } else {
        top = position.y;
    }

    i = 0;
    for (rowIndex = 0; rowIndex < rows; rowIndex += 1) {
        for (colIndex = 0; colIndex < columns; colIndex += 1) {
            x = left + colIndex * columnWidth;
            y = top + rowIndex * rowHeight;
            points[i] = new Point(x, y);
            i += 1;
        }
    }
    return points;
};

// Generates a Text object.
// The function can take many possible argument forms, either by listing them in order
// (text, x, y, fontFamily, fontSize, align, fill), or by using an options object.
// The position can be specified as x, y; using a point {x: 10, y: 20} or using an array [10, 20].
// Here are a couple of ways to generate 'Hello' at position 0, 0 in 12pt Helvetica, centered.
//
//     vg.text('Hello', {x: 0, y: 0}, 'Helvetica', 12, 'center');
//     vg.text('Hello', [0, 0], {fontFamily: 'Helvetica', fontSize: 12, align: 'center'});
//     vg.text('Hello', 0, 0, {fontFamily: 'Helvetica', fontSize: 12});  // align: center is the default.
//     vg.text('Hello', {fontFamily: 'Helvetica', fontSize: 12}); // the position defaults to 0,0.
vg.text = function () {
    var t = Object.create(gText.prototype);
    t.constructor = gText.prototype;
    gText.apply(t, arguments);
    return t;
};

vg.demoRect = function () {
    return new vg.rect({x: 0, y: 0}, 100, 100, {x: 0, y: 0});
};

vg.demoEllipse = function () {
    return new vg.ellipse({x: 0, y: 0}, 100, 100);
};

module.exports = vg;

},{"../objects/color":9,"../objects/path":12,"../objects/point":13,"../objects/text":15,"../util/geo":21,"lodash":2}],9:[function(require,module,exports){
// Color object

'use strict';

var math = require('../util/math');
var color = require('../util/color');
var js = require('../util/js');

// var RGB = 'RGB';
var HSB = 'HSB';
var HSL = 'HSL';
var HEX = 'HEX';

var Color = function (v1, v2, v3, v4, v5) {
    var _r, _g, _b, _a, rgb, options;
    if (v1 === undefined) {
        _r = _g = _b = 0;
        _a = 1;
    } else if (Array.isArray(v1)) {
        options = v2 || {};
        _r = v1[0] !== undefined ? v1[0] : 0;
        _g = v1[1] !== undefined ? v1[1] : 0;
        _b = v1[2] !== undefined ? v1[2] : 0;
        _a = v1[3] !== undefined ? v1[3] : options.range || 1;
    } else if (v1.r !== undefined) {
        options = v2 || {};
        _r = v1.r;
        _g = v1.g;
        _b = v1.b;
        _a = v1.a !== undefined ? v1.a : options.range || 1;
    } else if (typeof v1 === 'string') {
        rgb = color.hex2rgb(v1);
        _r = rgb[0];
        _g = rgb[1];
        _b = rgb[2];
        _a = 1;
    } else if (typeof v1 === 'number') {
        if (arguments.length === 1) { // Grayscale value
            _r = _g = _b = v1;
            _a = 1;
        } else if (arguments.length === 2) { // Gray and alpha or options
            _r = _g = _b = v1;
            if (typeof v2 === 'number') {
                _a = v2;
            } else {
                options = v2;
                _a = options.range || 1;
            }
        } else if (arguments.length === 3) { // RGB or gray, alpha and options
            if (typeof v3 === 'number') {
                _r = v1;
                _g = v2;
                _b = v3;
                _a = 1;
            } else {
                _r = _g = _b = v1;
                _a = v2;
                options = v3;
            }
        } else if (arguments.length === 4) { // RGB and alpha or options
            _r = v1;
            _g = v2;
            _b = v3;
            if (typeof v4 === 'number') {
                _a = v4;
            } else {
                options = v4;
                _a = options.range || 1;
            }
        } else { // RGBA + options
            _r = v1;
            _g = v2;
            _b = v3;
            _a = v4;
            options = v5;
        }
    }
    options = options || {};

    // The range option allows you to specify values in a different range.
    if (options.range !== undefined) {
        _r /= options.range;
        _g /= options.range;
        _b /= options.range;
        _a /= options.range;
        if (options.mode === HSB) {
            v1 /= options.range;
            v2 /= options.range;
            v3 /= options.range;
        }
    }
    // Convert HSB colors to RGB
    if (options.mode === HSB) {
        v1 = math.clamp(v1, 0, 1);
        v2 = math.clamp(v2, 0, 1);
        v3 = math.clamp(v3, 0, 1);
        rgb = color.hsb2rgb(v1, v2, v3);
        _r = rgb[0];
        _g = rgb[1];
        _b = rgb[2];
    // Convert HSL colors to RGB
    } else if (options.mode === HSL) {
        v1 = math.clamp(v1, 0, 1);
        v2 = math.clamp(v2, 0, 1);
        v3 = math.clamp(v3, 0, 1);
        rgb = color.hsl2rgb(v1, v2, v3);
        _r = rgb[0];
        _g = rgb[1];
        _b = rgb[2];
    } else if (options.mode === HEX) {
        rgb = color.hex2rgb(v1);
        _r = rgb[0];
        _g = rgb[1];
        _b = rgb[2];
        _a = 1;
    }

    this.r = math.clamp(_r, 0, 1);
    this.g = math.clamp(_g, 0, 1);
    this.b = math.clamp(_b, 0, 1);
    this.a = math.clamp(_a, 0, 1);
};

Color.BLACK = new Color(0);
Color.WHITE = new Color(1);

js.defineAlias(Color, 'r', 'red');
js.defineAlias(Color, 'g', 'green');
js.defineAlias(Color, 'b', 'blue');
js.defineAlias(Color, 'a', 'alpha');

// The hue of the color, in HSL color mode. (Although hue is the same in HSL and HSB).
js.defineGetter(Color, 'h', function () {
    return color.rgb2hsl(this.r, this.g, this.b)[0];
});

// The saturation of the color, in HSL color mode. (Saturation is different in HSL and HSB).
js.defineGetter(Color, 's', function () {
    return color.rgb2hsl(this.r, this.g, this.b)[1];
});

// The lightness of the color, in HSL color mode. (Lightness in HSL is different from brightness in HSB).
js.defineGetter(Color, 'l', function () {
    return color.rgb2hsl(this.r, this.g, this.b)[2];
});

js.defineAlias(Color, 'h', 'hue');
js.defineAlias(Color, 's', 'saturation');
js.defineAlias(Color, 'l', 'lightness');


js.defineGetter(Color, 'rgb', function () {
    return [this.r, this.g, this.b];
});

js.defineGetter(Color, 'rgba', function () {
    return [this.r, this.g, this.b, this.a];
});

js.defineGetter(Color, 'hsb', function () {
    return color.rgb2hsb(this.r, this.g, this.b);
});

js.defineGetter(Color, 'hsba', function () {
    return color.rgb2hsb(this.r, this.g, this.b).concat([this.a]);
});

js.defineGetter(Color, 'hsl', function () {
    return color.rgb2hsl(this.r, this.g, this.b);
});

js.defineGetter(Color, 'hsla', function () {
    return color.rgb2hsl(this.r, this.g, this.b).concat([this.a]);
});

Color.prototype.toCSS = function () {
    return Color.toCSS(this);
};

Color.prototype.toHex = function () {
    if (this.a >= 1) {
        return color.rgb2hex(this.r, this.g, this.b);
    } else {
        return color.rgba2hex(this.r, this.g, this.b, this.a);
    }
};

Color.prototype.desaturate = function (options) {
    if (this.r === this.g && this.g === this.b) { return this; }
    var rCoeff, gCoeff, bCoeff;
    if (options === undefined || !options.method || options.method === 'ITU-R BT.601') {
        rCoeff = 0.3; gCoeff = 0.59; bCoeff = 0.11;
    } else if (options.method === 'ITU-R BT.709') {
        rCoeff = 0.2125; gCoeff = 0.7154; bCoeff = 0.0721;
    }
    var gray = this.r * rCoeff + this.g * gCoeff + this.b * bCoeff;
    return new Color(gray, gray, gray, this.a);
};

Color.prototype.invert = function () {
    return new Color(1 - this.r, 1 - this.g, 1 - this.b, this.a);
};

Color.clone = function (c) {
    if (c === null || c === undefined) {
        return null;
    } else if (typeof c === 'string') {
        return c;
    } else {
        return new Color(c.r, c.g, c.b, c.a);
    }
};

Color.toCSS = function (c) {
    if (c === null) {
        return 'none';
    } else if (c === undefined) {
        return 'black';
    } else if (typeof c === 'string') {
        return c;
    } else if (c instanceof Color) {
        var r255 = Math.round(c.r * 255),
            g255 = Math.round(c.g * 255),
            b255 = Math.round(c.b * 255);
        return 'rgba(' + r255 + ', ' + g255 + ', ' + b255 + ', ' + c.a + ')';
    } else if (c.r !== undefined && c.g !== undefined && c.b !== undefined) {
        if (c.a === undefined) {
            return 'rgb(' + c.r + ', ' + c.g + ', ' + c.b + ')';
        } else {
            return 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + c.a + ')';
        }
    } else {
        throw new Error('Don\'t know how to convert ' + c + ' to CSS.');
    }
};

Color.toHex = function (c) {
    return Color.parse(c).toHex();
};

Color.make = function () {
    var c = Object.create(Color.prototype);
    c.constructor = Color.prototype;
    Color.apply(c, arguments);
    return c;
};

Color.parse = function (s) {
    function startsWith (s, value) {
        if (!s || !value) { return false; }
        s = String(s);
        return s.indexOf(value) === 0;
    }

    var m;
    if (s === undefined || s === null) {
        return new Color(0, 0, 0, 0);
    } else if (s instanceof Color) {
        return s;
    } else if (color.namedColors[s]) {
        return Color.make.apply(null, color.namedColors[s]);
    } else if (s[0] === '#') {
        return new Color(s, 0, 0, 0, { mode: HEX });
    } else if (startsWith(s, 'rgba')) {
        m = s.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+|\d+.\d+)\s*\)$/i);
        if (m) {
            return new Color(parseInt(m[1]) / 255, parseInt(m[2]) / 255, parseInt(m[3]) / 255, parseFloat(m[4]));
        } else {
            m = s.match(/^rgba\s*\(\s*(\d+|\d+.\d+)%\s*,\s*(\d+|\d+.\d+)%\s*,\s*(\d+|\d+.\d+)%\s*,\s*(\d+|\d+.\d+)\s*\)$/i);
            if (m) {
                return new Color(parseFloat(m[1]) / 100, parseFloat(m[2]) / 100, parseFloat(m[3]) / 100, parseFloat(m[4]));
            }
        }
        return new Color(0, 0, 0, 0);
    } else if (startsWith(s, 'rgb')) {
        m = s.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (m) {
            return new Color(parseInt(m[1]) / 255, parseInt(m[2]) / 255, parseInt(m[3]) / 255);
        } else {
            m = s.match(/^rgb\s*\(\s*(\d+|\d+.\d+)%\s*,\s*(\d+|\d+.\d+)%\s*,\s*(\d+|\d+.\d+)%\s*\)$/i);
            if (m) {
                return new Color(parseFloat(m[1]) / 100, parseFloat(m[2]) / 100, parseFloat(m[3]) / 100);
            }
        }
        return new Color(0, 0, 0, 0);
    } else if (startsWith(s, 'hsla')) {
        m = s.match(/^hsla\s*\(\s*(\d+|\d+.\d+)\s*,\s*(\d+|\d+.\d+)%\s*,\s*(\d+|\d+.\d+)%\s*,\s*(\d+|\d+.\d+)\s*\)$/i);
        if (m) {
            return new Color(parseFloat(m[1]) / 360, parseFloat(m[2]) / 100, parseFloat(m[3]) / 100, parseFloat(m[4]));
        }
        return new Color(0, 0, 0, 0);
    } else if (startsWith(s, 'hsl')) {
        m = s.match(/^hsl\s*\(\s*(\d+|\d+.\d+)\s*,\s*(\d+|\d+.\d+)%\s*,\s*(\d+|\d+.\d+)%\s*\)$/i);
        if (m) {
            return new Color(parseFloat(m[1]) / 360, parseFloat(m[2]) / 100, parseFloat(m[3]) / 100);
        }
        return new Color(0, 0, 0, 0);
    } else if (s === 'none') {
        return new Color(0, 0, 0, 0);
    } else {
        throw new Error('Color ' + s + 'can not be parsed');
    }
};

Color.gray = function (gray, alpha, range) {
    range = Math.max(range, 1);
    return new Color(gray / range, gray / range, gray / range, alpha / range);
};

Color.rgb = function (red, green, blue, alpha, range) {
    range = Math.max(range, 1);
    return new Color(red / range, green / range, blue / range, alpha / range);
};

Color.hsb = function (hue, saturation, brightness, alpha, range) {
    range = Math.max(range, 1);
    return new Color(hue / range, saturation / range, brightness / range, alpha / range, { mode: HSB });
};

Color.hsl = function (hue, saturation, lightness, alpha, range) {
    range = Math.max(range, 1);
    return new Color(hue / range, saturation / range, lightness / range, alpha / range, { mode: HSL });
};

module.exports = Color;

},{"../util/color":20,"../util/js":22,"../util/math":23}],10:[function(require,module,exports){
// Shape group object

'use strict';

var _ = require('lodash');

var Path = require('../objects/path');
var Rect = require('../objects/rect');
var Color = require('../objects/color');

var Group = function (shapes) {
    if (!shapes) {
        this.shapes = [];
    } else if (shapes.shapes || shapes.commands) {
        this.shapes = [shapes];
    } else if (shapes) {
        this.shapes = shapes;
    }
};

Group.prototype.add = function (shape) {
    this.shapes.push(shape);
};

Group.prototype.clone = function () {
    var newShapes = [],
        n = this.shapes.length,
        i;
    newShapes.length = n;
    for (i = 0; i < n; i += 1) {
        newShapes[i] = this.shapes[i].clone();
    }
    return new Group(newShapes);
};

Group.prototype.colorize = function (options) {
    var args = arguments;
    if (typeof options !== 'object' || options instanceof Color) {
        options = {};
        if (args[0] !== undefined) { options.fill = args[0]; }
        if (args[1] !== undefined) { options.stroke = args[1]; }
        if (args[2] !== undefined) { options.strokeWidth = args[2]; }
    }
    var shapes = _.map(this.shapes, function (shape) {
        return shape.colorize(options);
    });
    return new Group(shapes);
};

Group.prototype.desaturate = function (options) {
    var shapes = _.map(this.shapes, function (shape) {
        return shape.desaturate(options);
    });
    return new Group(shapes);
};

Group.prototype.invert = function () {
    var shapes = _.map(this.shapes, function (shape) {
        return shape.invert();
    });
    return new Group(shapes);
};

Group.prototype.bounds = function () {
    if (this.shapes.length === 0) { return new Rect(0, 0, 0, 0); }
    var i, r, shape,
        shapes = this.shapes;
    for (i = 0; i < shapes.length; i += 1) {
        shape = shapes[i];
        if (r === undefined) {
            r = shape.bounds();
        }
        if ((shape.shapes && shape.shapes.length !== 0) ||
            (shape.commands && shape.commands.length !== 0)) {
            r = r.unite(shape.bounds());
        }
    }
    return (r !== undefined) ? r : new Rect(0, 0, 0, 0);
};

// Returns true when point (x,y) falls within the contours of the group.
Group.prototype.contains = function (x, y, precision) {
    if (precision === undefined) { precision = 100; }
    var i, shapes = this.shapes;
    for (i = 0; i < shapes.length; i += 1) {
        if (shapes[i].contains(x, y, precision)) {
            return true;
        }
    }
    return false;
};

Group.prototype.length = function (precision) {
    if (precision === undefined) { precision = 10; }
    var sum = 0;
    var shapes = this.shapes;
    for (var i = 0; i < shapes.length; i += 1) {
        sum += shapes[i].length(precision);
    }
    return sum;
};

Group.prototype.resampleByAmount = function (points, perContour) {
    var path, shapes;
    if (!perContour) {
        path = new Path.combine(this);
        return path.resampleByAmount(points, perContour);
    }

    shapes = _.map(this.shapes, function (shape) {
        return shape.resampleByAmount(points, perContour);
    });
    return new Group(shapes);
};

Group.prototype.resampleByLength = function (length) {
    var shapes = _.map(this.shapes, function (shape) {
        return shape.resampleByLength(length);
    });
    return new Group(shapes);
};

Group.prototype.toSVG = function () {
    var l;
    l = _.map(this.shapes, function (shape) {
        return shape.toSVG();
    });
    return '<g>' + l.join('') + '</g>';
};

// Draw the group to a 2D context.
Group.prototype.draw = function (ctx) {
    var i, shapes = this.shapes, nShapes = shapes.length;
    for (i = 0; i < nShapes; i += 1) {
        shapes[i].draw(ctx);
    }
};

module.exports = Group;

},{"../objects/color":9,"../objects/path":12,"../objects/rect":14,"lodash":2}],11:[function(require,module,exports){
// 3-dimensional matrix

'use strict';

var Vec3 = require('../objects/vec3');

// Construct a 4x4 matrix.
var Matrix4 = function (m) {
    if (m !== undefined) {
       // TODO Check for type and length
        this.m = m;
    } else {
        m = new Float32Array(16);
        m[0] = 1.0;
        m[1] = 0.0;
        m[2] = 0.0;
        m[3] = 0.0;
        m[4] = 0.0;
        m[5] = 1.0;
        m[6] = 0.0;
        m[7] = 0.0;
        m[8] = 0.0;
        m[9] = 0.0;
        m[10] = 1.0;
        m[11] = 0.0;
        m[12] = 0.0;
        m[13] = 0.0;
        m[14] = 0.0;
        m[15] = 1.0;
        this.m = m;
    }
};

Matrix4.IDENTITY = new Matrix4();

// Create a perspective matrix transformation.
Matrix4.perspective = function (fov, aspect, zNear, zFar) {
    var m = new Float32Array(Matrix4.IDENTITY.m),
        tan = 1.0 / (Math.tan(fov * 0.5));

    m[0] = tan / aspect;
    m[1] = m[2] = m[3] = 0.0;
    m[5] = tan;
    m[4] = m[6] = m[7] = 0.0;
    m[8] = m[9] = 0.0;
    m[10] = -zFar / (zNear - zFar);
    m[11] = 1.0;
    m[12] = m[13] = m[15] = 0.0;
    m[14] = (zNear * zFar) / (zNear - zFar);

    return new Matrix4(m);
};

Matrix4.lookAt = function (eye, target, up) {
    var m, zAxis, xAxis, yAxis, ex, ey, ez;
    m = new Float32Array(16);
    zAxis = target.subtract(eye).normalize();
    xAxis = Vec3.cross(up, zAxis).normalize();
    yAxis = Vec3.cross(zAxis, xAxis).normalize();

    ex = -Vec3.dot(xAxis, eye);
    ey = -Vec3.dot(yAxis, eye);
    ez = -Vec3.dot(zAxis, eye);

    m[0] = xAxis.x;
    m[1] = yAxis.x;
    m[2] = zAxis.x;
    m[3] = 0;
    m[4] = xAxis.y;
    m[5] = yAxis.y;
    m[6] = zAxis.y;
    m[7] = 0;
    m[8] = xAxis.z;
    m[9] = yAxis.z;
    m[10] = zAxis.z;
    m[11] = 0;
    m[12] = ex;
    m[13] = ey;
    m[14] = ez;
    m[15] = 1;

    return new Matrix4(m);
};

// Return a new matrix with the inversion of this matrix.
Matrix4.prototype.invert = function () {
    var l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13, l14, l15, l16, l17, l18, l19, l20, l21, l22, l23, l24, l25, l26, l27, l28,
        l29, l30, l31, l32, l33, l34, l35, l36, l37, l38, l39, m;
    l1 = this.m[0];
    l2 = this.m[1];
    l3 = this.m[2];
    l4 = this.m[3];
    l5 = this.m[4];
    l6 = this.m[5];
    l7 = this.m[6];
    l8 = this.m[7];
    l9 = this.m[8];
    l10 = this.m[9];
    l11 = this.m[10];
    l12 = this.m[11];
    l13 = this.m[12];
    l14 = this.m[13];
    l15 = this.m[14];
    l16 = this.m[15];
    l17 = (l11 * l16) - (l12 * l15);
    l18 = (l10 * l16) - (l12 * l14);
    l19 = (l10 * l15) - (l11 * l14);
    l20 = (l9 * l16) - (l12 * l13);
    l21 = (l9 * l15) - (l11 * l13);
    l22 = (l9 * l14) - (l10 * l13);
    l23 = ((l6 * l17) - (l7 * l18)) + (l8 * l19);
    l24 = -(((l5 * l17) - (l7 * l20)) + (l8 * l21));
    l25 = ((l5 * l18) - (l6 * l20)) + (l8 * l22);
    l26 = -(((l5 * l19) - (l6 * l21)) + (l7 * l22));
    l27 = 1.0 / ((((l1 * l23) + (l2 * l24)) + (l3 * l25)) + (l4 * l26));
    l28 = (l7 * l16) - (l8 * l15);
    l29 = (l6 * l16) - (l8 * l14);
    l30 = (l6 * l15) - (l7 * l14);
    l31 = (l5 * l16) - (l8 * l13);
    l32 = (l5 * l15) - (l7 * l13);
    l33 = (l5 * l14) - (l6 * l13);
    l34 = (l7 * l12) - (l8 * l11);
    l35 = (l6 * l12) - (l8 * l10);
    l36 = (l6 * l11) - (l7 * l10);
    l37 = (l5 * l12) - (l8 * l9);
    l38 = (l5 * l11) - (l7 * l9);
    l39 = (l5 * l10) - (l6 * l9);

    m = new Float32Array(16);
    m[0] = l23 * l27;
    m[4] = l24 * l27;
    m[8] = l25 * l27;
    m[12] = l26 * l27;
    m[1] = -(((l2 * l17) - (l3 * l18)) + (l4 * l19)) * l27;
    m[5] = (((l1 * l17) - (l3 * l20)) + (l4 * l21)) * l27;
    m[9] = -(((l1 * l18) - (l2 * l20)) + (l4 * l22)) * l27;
    m[13] = (((l1 * l19) - (l2 * l21)) + (l3 * l22)) * l27;
    m[2] = (((l2 * l28) - (l3 * l29)) + (l4 * l30)) * l27;
    m[6] = -(((l1 * l28) - (l3 * l31)) + (l4 * l32)) * l27;
    m[10] = (((l1 * l29) - (l2 * l31)) + (l4 * l33)) * l27;
    m[14] = -(((l1 * l30) - (l2 * l32)) + (l3 * l33)) * l27;
    m[3] = -(((l2 * l34) - (l3 * l35)) + (l4 * l36)) * l27;
    m[7] = (((l1 * l34) - (l3 * l37)) + (l4 * l38)) * l27;
    m[11] = -(((l1 * l35) - (l2 * l37)) + (l4 * l39)) * l27;
    m[15] = (((l1 * l36) - (l2 * l38)) + (l3 * l39)) * l27;
    return new Matrix4(m);
};

Matrix4.prototype.multiply = function (other) {
    var m = new Float32Array(16);

    m[0] = this.m[0] * other.m[0] + this.m[1] * other.m[4] + this.m[2] * other.m[8] + this.m[3] * other.m[12];
    m[1] = this.m[0] * other.m[1] + this.m[1] * other.m[5] + this.m[2] * other.m[9] + this.m[3] * other.m[13];
    m[2] = this.m[0] * other.m[2] + this.m[1] * other.m[6] + this.m[2] * other.m[10] + this.m[3] * other.m[14];
    m[3] = this.m[0] * other.m[3] + this.m[1] * other.m[7] + this.m[2] * other.m[11] + this.m[3] * other.m[15];

    m[4] = this.m[4] * other.m[0] + this.m[5] * other.m[4] + this.m[6] * other.m[8] + this.m[7] * other.m[12];
    m[5] = this.m[4] * other.m[1] + this.m[5] * other.m[5] + this.m[6] * other.m[9] + this.m[7] * other.m[13];
    m[6] = this.m[4] * other.m[2] + this.m[5] * other.m[6] + this.m[6] * other.m[10] + this.m[7] * other.m[14];
    m[7] = this.m[4] * other.m[3] + this.m[5] * other.m[7] + this.m[6] * other.m[11] + this.m[7] * other.m[15];

    m[8] = this.m[8] * other.m[0] + this.m[9] * other.m[4] + this.m[10] * other.m[8] + this.m[11] * other.m[12];
    m[9] = this.m[8] * other.m[1] + this.m[9] * other.m[5] + this.m[10] * other.m[9] + this.m[11] * other.m[13];
    m[10] = this.m[8] * other.m[2] + this.m[9] * other.m[6] + this.m[10] * other.m[10] + this.m[11] * other.m[14];
    m[11] = this.m[8] * other.m[3] + this.m[9] * other.m[7] + this.m[10] * other.m[11] + this.m[11] * other.m[15];

    m[12] = this.m[12] * other.m[0] + this.m[13] * other.m[4] + this.m[14] * other.m[8] + this.m[15] * other.m[12];
    m[13] = this.m[12] * other.m[1] + this.m[13] * other.m[5] + this.m[14] * other.m[9] + this.m[15] * other.m[13];
    m[14] = this.m[12] * other.m[2] + this.m[13] * other.m[6] + this.m[14] * other.m[10] + this.m[15] * other.m[14];
    m[15] = this.m[12] * other.m[3] + this.m[13] * other.m[7] + this.m[14] * other.m[11] + this.m[15] * other.m[15];

    return new Matrix4(m);
};

Matrix4.prototype.translate = function (tx, ty, tz) {
    var m = new Float32Array(this.m);
    m[12] += tx;
    m[13] += ty;
    m[14] += tz;
    return new Matrix4(m);
};

module.exports = Matrix4;
},{"../objects/vec3":18}],12:[function(require,module,exports){
// Bézier path object

'use strict';

var _ = require('lodash');

var bezier = require('../util/bezier');
var geo = require('../util/geo');
var math = require('../util/math');

var Color = require('../objects/color');
var Rect = require('../objects/rect');

var MOVETO  = bezier.MOVETO;
var LINETO  = bezier.LINETO;
var QUADTO  = bezier.QUADTO;
var CURVETO = bezier.CURVETO;
var CLOSE   = bezier.CLOSE;

var CLOSE_COMMAND = Object.freeze({ type: CLOSE });

var KAPPA = 0.5522847498307936; // (-1 + Math.sqrt(2)) / 3 * 4

function _cloneCommand(cmd) {
    var newCmd = {type: cmd.type};
    if (newCmd.type !== CLOSE) {
        newCmd.x = cmd.x;
        newCmd.y = cmd.y;
    }
    if (newCmd.type === QUADTO) {
        newCmd.x1 = cmd.x1;
        newCmd.y1 = cmd.y1;
    } else if (newCmd.type === CURVETO) {
        newCmd.x1 = cmd.x1;
        newCmd.y1 = cmd.y1;
        newCmd.x2 = cmd.x2;
        newCmd.y2 = cmd.y2;
    }
    return newCmd;
}

var Path = function (commands, fill, stroke, strokeWidth) {
    this.commands = commands !== undefined ? commands : [];
    this.fill = fill !== undefined ? fill : 'black';
    this.stroke = stroke !== undefined ? stroke : null;
    this.strokeWidth = strokeWidth !== undefined ? strokeWidth : 1;
};

Path.prototype.clone = function () {
    var p = new Path(),
        n = this.commands.length,
        i;
    p.commands.length = this.commands.length;
    for (i = 0; i < n; i += 1) {
        p.commands[i] = _cloneCommand(this.commands[i]);
    }
    p.fill = Color.clone(this.fill);
    p.stroke =  Color.clone(this.stroke);
    p.strokeWidth = this.strokeWidth;
    return p;
};

Path.prototype.extend = function (commandsOrPath) {
    var commands = commandsOrPath.commands || commandsOrPath;
    Array.prototype.push.apply(this.commands, commands);
};

Path.prototype.moveTo = function (x, y) {
    this.commands.push({type: MOVETO, x: x, y: y});
};

Path.prototype.lineTo = function (x, y) {
    this.commands.push({type: LINETO, x: x, y: y});
};

Path.prototype.curveTo = function (x1, y1, x2, y2, x, y) {
    this.commands.push({type: CURVETO, x1: x1, y1: y1, x2: x2, y2: y2, x: x, y: y});
};

Path.prototype.quadTo = function (x1, y1, x, y) {
    var prevX = this.commands[this.commands.length - 1].x,
        prevY = this.commands[this.commands.length - 1].y,
        cp1x = prevX + 2 / 3 * (x1 - prevX),
        cp1y = prevY + 2 / 3 * (y1 - prevY),
        cp2x = cp1x + 1 / 3 * (x - prevX),
        cp2y = cp1y + 1 / 3 * (y - prevY);
    this.curveTo(cp1x, cp1y, cp2x, cp2y, x, y);
};

Path.prototype.closePath = Path.prototype.close = function () {
    this.commands.push(CLOSE_COMMAND);
};

Path.prototype.isClosed = function () {
    if (this.commands.length === 0) { return false; }
    return this.commands[this.commands.length - 1].type === CLOSE;
};

Path.prototype.addRect = function (x, y, width, height) {
    this.moveTo(x, y);
    this.lineTo(x + width, y);
    this.lineTo(x + width, y + height);
    this.lineTo(x, y + height);
    this.close();
};

Path.prototype.addRoundedRect = function (cx, cy, width, height, rx, ry) {
    var ONE_MINUS_QUARTER = 1.0 - 0.552,

        dx = rx,
        dy = ry,

        left = cx,
        right = cx + width,
        top = cy,
        bottom = cy + height;

    // rx/ry cannot be greater than half of the width of the rectangle
    // (required by SVG spec)
    dx = Math.min(dx, width * 0.5);
    dy = Math.min(dy, height * 0.5);
    this.moveTo(left + dx, top);
    if (dx < width * 0.5) {
        this.lineTo(right - rx, top);
    }
    this.curveTo(right - dx * ONE_MINUS_QUARTER, top, right, top + dy * ONE_MINUS_QUARTER, right, top + dy);
    if (dy < height * 0.5) {
        this.lineTo(right, bottom - dy);
    }
    this.curveTo(right, bottom - dy * ONE_MINUS_QUARTER, right - dx * ONE_MINUS_QUARTER, bottom, right - dx, bottom);
    if (dx < width * 0.5) {
        this.lineTo(left + dx, bottom);
    }
    this.curveTo(left + dx * ONE_MINUS_QUARTER, bottom, left, bottom - dy * ONE_MINUS_QUARTER, left, bottom - dy);
    if (dy < height * 0.5) {
        this.lineTo(left, top + dy);
    }
    this.curveTo(left, top + dy * ONE_MINUS_QUARTER, left + dx * ONE_MINUS_QUARTER, top, left + dx, top);
    this.close();
};

Path.prototype.addEllipse = function (x, y, width, height) {
    var dx = KAPPA * 0.5 * width;
    var dy = KAPPA * 0.5 * height;
    var x0 = x + 0.5 * width;
    var y0 = y + 0.5 * height;
    var x1 = x + width;
    var y1 = y + height;

    this.moveTo(x, y0);
    this.curveTo(x, y0 - dy, x0 - dx, y, x0, y);
    this.curveTo(x0 + dx, y, x1, y0 - dy, x1, y0);
    this.curveTo(x1, y0 + dy, x0 + dx, y1, x0, y1);
    this.curveTo(x0 - dx, y1, x, y0 + dy, x, y0);
    this.close();
};

Path.prototype.addLine = function (x1, y1, x2, y2) {
    this.moveTo(x1, y1);
    this.lineTo(x2, y2);
};

Path.prototype.addQuad = function (x1, y1, x2, y2, x3, y3, x4, y4) {
    this.moveTo(x1, y1);
    this.lineTo(x2, y2);
    this.lineTo(x3, y3);
    this.lineTo(x4, y4);
    this.close();
};

Path.prototype.addArc = function (x, y, width, height, startAngle, degrees, arcType) {
    arcType = arcType || 'pie';
    var w, h, angStRad, ext, arcSegs, increment, cv, lineSegs,
        index, angle, relX, relY, coords;
    w = width / 2;
    h = height / 2;
    angStRad = math.radians(startAngle);
    ext = degrees;

    if (ext >= 360.0 || ext <= -360) {
        arcSegs = 4;
        increment = Math.PI / 2;
        cv = 0.5522847498307933;
        if (ext < 0) {
            increment = -increment;
            cv = -cv;
        }
    } else {
        arcSegs = Math.ceil(Math.abs(ext) / 90.0);
        increment = math.radians(ext / arcSegs);
        cv = 4.0 / 3.0 * Math.sin(increment / 2.0) / (1.0 + Math.cos(increment / 2.0));
        if (cv === 0) {
            arcSegs = 0;
        }
    }

    if (arcType === 'open') {
        lineSegs = 0;
    } else if (arcType === 'chord') {
        lineSegs = 1;
    } else if (arcType === 'pie') {
        lineSegs = 2;
    }

    if (w < 0 || h < 0) {
        arcSegs = lineSegs = -1;
    }

    index = 0;
    while (index <= arcSegs + lineSegs) {
        angle = angStRad;
        if (index === 0) {
            this.moveTo(x + Math.cos(angle) * w, y + Math.sin(angle) * h);
        } else if (index > arcSegs) {
            if (index === arcSegs + lineSegs) {
                this.close();
            } else {
                this.lineTo(x, y);
            }
        } else {
            angle += increment * (index - 1);
            relX = Math.cos(angle);
            relY = Math.sin(angle);
            coords = [];
            coords.push(x + (relX - cv * relY) * w);
            coords.push(y + (relY + cv * relX) * h);
            angle += increment;
            relX = Math.cos(angle);
            relY = Math.sin(angle);
            coords.push(x + (relX + cv * relY) * w);
            coords.push(y + (relY - cv * relX) * h);
            coords.push(x + relX * w);
            coords.push(y + relY * h);
            Path.prototype.curveTo.apply(this, coords);
        }
        index += 1;
    }
};

Path.prototype.colorize = function (options) {
    var args = arguments;
    if (typeof options !== 'object' || options instanceof Color) {
        options = {};
        if (args[0] !== undefined) { options.fill = args[0]; }
        if (args[1] !== undefined) { options.stroke = args[1]; }
        if (args[2] !== undefined) { options.strokeWidth = args[2]; }
    }
    var p = this.clone();
    if (options.fill) {
        p.fill = Color.clone(options.fill);
    }
    if (options.stroke) {
        p.stroke = Color.clone(options.stroke);
    }
    if (options.strokeWidth || options.strokeWidth === 0) {
        p.strokeWidth = options.strokeWidth;
    }
    return p;
};

Path.prototype.desaturate = function (options) {
    var p = this.clone();
    var fill = p.fill;
    var stroke = p.stroke;
    if (!(fill instanceof Color)) {
        fill = Color.parse(fill);
    }
    if (!(stroke instanceof Color)) {
        stroke = Color.parse(stroke);
    }
    p.fill = fill.desaturate(options);
    p.stroke = stroke.desaturate(options);
    return p;
};

Path.prototype.invert = function () {
    var p = this.clone();
    var fill = p.fill;
    var stroke = p.stroke;
    if (!(fill instanceof Color)) {
        fill = Color.parse(fill);
    }
    if (!(stroke instanceof Color)) {
        stroke = Color.parse(stroke);
    }
    p.fill = fill.invert();
    p.stroke = stroke.invert();
    return p;
};

Path.prototype.contours = function () {
    var contours = [],
        currentContour = [];
    _.each(this.commands, function (cmd) {
        if (cmd.type === MOVETO) {
            if (currentContour.length !== 0) {
                contours.push(currentContour);
            }
            currentContour = [cmd];
        } else {
            currentContour.push(cmd);
        }
    });

    if (currentContour.length !== 0) {
        contours.push(currentContour);
    }

    return contours;
};

Path.prototype.bounds = function () {
    if (this._bounds) { return this._bounds; }
    if (this.commands.length === 0) { return new Rect(0, 0, 0, 0); }

    var px, py, prev, right, bottom,
        minX = Number.MAX_VALUE,
        minY = Number.MAX_VALUE,
        maxX = -(Number.MAX_VALUE),
        maxY = -(Number.MAX_VALUE);

    _.each(this.commands, function (cmd) {
        if (cmd.type === MOVETO || cmd.type === LINETO) {
            px = cmd.x;
            py = cmd.y;
            if (px < minX) { minX = px; }
            if (py < minY) { minY = py; }
            if (px > maxX) { maxX = px; }
            if (py > maxY) { maxY = py; }
            prev = cmd;
        } else if (cmd.type === CURVETO) {
            var r = bezier.extrema(prev.x, prev.y, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            right = r.x + r.width;
            bottom = r.y + r.height;
            if (r.x < minX) { minX = r.x; }
            if (right > maxX) { maxX = right; }
            if (r.y < minY) { minY = r.y; }
            if (bottom > maxY) { maxY = bottom; }
            prev = cmd;
        }
    });

    return new Rect(minX, minY, maxX - minX, maxY - minY);
};

// Returns the DynamicPathElement at time t (0.0-1.0) on the path.
Path.prototype.point = function (t, segmentLengths) {
    if (segmentLengths === undefined) {
        // Cache the segment lengths for performance.
        segmentLengths = bezier.segmentLengths(this.commands, true, 10);
    }
    return bezier.point(this, t, segmentLengths);
};

// Returns an array of DynamicPathElements along the path.
// To omit the last point on closed paths: {end: 1-1.0/amount}
Path.prototype.points = function (amount, options) {
    var start = (options && options.start !== undefined) ? options.start : 0.0;
    var end = (options && options.end !== undefined) ? options.end : 1.0;
    if (this.commands.length === 0) {
        // Otherwise bezier.point() will raise an error for empty paths.
        return [];
    }
    amount = Math.round(amount);
    // "d" is the delta value for each point.
    // For closed paths (e.g. a circle), we don't want the last point, because it will equal the first point.
    // For open paths (e.g. a line) we do want the last point, so we use amount - 1.
    // E.g. If amount=4, and path is open, we want the point at t 0.0, 0.33, 0.66 and 1.0.
    // E.g. If amount=2, and path is open, we want the point at t 0.0 and 1.0.
    var d;
    if (options && options.closed) {
        d = (amount > 1) ? (end - start) / amount : (end - start);
    } else {
        d = (amount > 1) ? (end - start) / (amount - 1) : (end - start);
    }
    var pts = [];
    var segmentLengths = bezier.segmentLengths(this.commands, true, 10);
    for (var i = 0; i < amount; i += 1) {
        pts.push(this.point(start + d * i, segmentLengths));
    }
    return pts;
};

// Returns an approximation of the total length of the path.
Path.prototype.length = function (precision) {
    if (precision === undefined) { precision = 20; }
    return bezier.length(this, precision);
};

// Returns true when point (x,y) falls within the contours of the path.
Path.prototype.contains = function (x, y, precision) {
    var points = this.points(precision !== undefined ? precision : 100);
    return geo.pointInPolygon(points, x, y);
};

Path.prototype.resampleByAmount = function (points, perContour) {
    var subPaths = perContour ? this.contours() : [this.commands];
    var p = new Path([], this.fill, this.stroke, this.strokeWidth);
    for (var j = 0; j < subPaths.length; j += 1) {
        var subPath = new Path(subPaths[j]);
        var options = {};
        if (subPath.isClosed()) {
            options.closed = true;
        }
        var pts = subPath.points(points, options);
        for (var i = 0; i < pts.length; i += 1) {
            if (i === 0) {
                p.moveTo(pts[i].x, pts[i].y);
            } else {
                p.lineTo(pts[i].x, pts[i].y);
            }
        }
        if (subPath.isClosed()) {
            p.close();
        }
    }
    return p;
};

Path.prototype.resampleByLength = function (segmentLength, options) {
    options = options || {};
    var force = options.force || false;
    var subPaths = this.contours();
    var commands = [];
    if (!force) {
        segmentLength = Math.max(segmentLength, 1);
    }
    for (var i = 0; i < subPaths.length; i += 1) {
        var subPath = new Path(subPaths[i]);
        var contourLength = subPath.length();
        var amount = Math.ceil(contourLength / segmentLength);
        commands = commands.concat(subPath.resampleByAmount(amount).commands);
    }
    return new Path(commands, this.fill, this.stroke, this.strokeWidth);
};

Path.prototype.toPathData = function () {
    var i, d, cmd, x, y, x1, y1, x2, y2;
    d = '';
    for (i = 0; i < this.commands.length; i += 1) {
        cmd = this.commands[i];
        if (cmd.x !== undefined) {
            x = math.clamp(cmd.x, -9999, 9999);
            y = math.clamp(cmd.y, -9999, 9999);
        }
        if (cmd.x1 !== undefined) {
            x1 = math.clamp(cmd.x1, -9999, 9999);
            y1 = math.clamp(cmd.y1, -9999, 9999);
        }
        if (cmd.x2 !== undefined) {
            x2 = math.clamp(cmd.x2, -9999, 9999);
            y2 = math.clamp(cmd.y2, -9999, 9999);
        }
        if (cmd.type === MOVETO) {
            if (!isNaN(x) && !isNaN(y)) {
                d += 'M' + x + ' ' + y;
            }
        } else if (cmd.type === LINETO) {
            if (!isNaN(x) && !isNaN(y)) {
                d += 'L' + x + ' ' + y;
            }
        } else if (cmd.type === QUADTO) {
            if (!isNaN(x) && !isNaN(y) && !isNaN(x1) && !isNaN(y1)) {
                d += 'Q' + x1 + ' ' + y1 + ' ' + x + ' ' + y;
            }
        } else if (cmd.type === CURVETO) {
            if (!isNaN(x) && !isNaN(y) && !isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
                d += 'C' + x1 + ' ' + y1 + ' ' + x2 + ' ' + y2 + ' ' + x + ' ' + y;
            }
        } else if (cmd.type === CLOSE) {
            d += 'Z';
        }
    }
    return d;
};

// Output the path as an SVG string.
Path.prototype.toSVG = function () {
    var svg = '<path d="';
    svg += this.toPathData();
    svg += '"';
    var fill;
    if (this.fill && this.fill.r !== undefined) {
        fill = Color.toCSS(this.fill);
    } else {
        fill = this.fill;
    }
    if (fill !== 'black') {
        if (fill === null) {
            svg += ' fill="none"';
        } else {
            svg += ' fill="' + fill + '"';
        }
    }
    var stroke;
    if (this.stroke && this.stroke.r !== undefined) {
        stroke = Color.toCSS(this.stroke);
    } else {
        stroke = this.stroke;
    }
    if (stroke) {
        svg += ' stroke="' + stroke + '" stroke-width="' + this.strokeWidth + '"';
    }
    svg += '/>';
    return svg;
};

// Draw the path to a 2D context.
Path.prototype.draw = function (ctx) {
    var nCommands, i, cmd;
    ctx.beginPath();
    nCommands = this.commands.length;
    for (i = 0; i < nCommands; i += 1) {
        cmd = this.commands[i];
        if (cmd.type === MOVETO) {
            ctx.moveTo(cmd.x, cmd.y);
        } else if (cmd.type === LINETO) {
            ctx.lineTo(cmd.x, cmd.y);
        } else if (cmd.type === QUADTO) {
            ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
        } else if (cmd.type === CURVETO) {
            ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
        } else if (cmd.type === CLOSE) {
            ctx.closePath();
        }
    }
    if (this.fill !== null) {
        ctx.fillStyle = Color.toCSS(this.fill);
        ctx.fill();
    }
    if (this.stroke !== null && this.strokeWidth !== null && this.strokeWidth > 0) {
        ctx.strokeStyle = Color.toCSS(this.stroke);
        ctx.lineWidth = this.strokeWidth;
        ctx.stroke();
    }
};

Path.combine = function () {
    var shapes = _.flatten(arguments);
    var commands = [];
    for (var i = 0; i < shapes.length; i += 1) {
        var shape = shapes[i];
        if (shape.commands) {
            commands = commands.concat(shape.commands);
        } else if (shape.shapes) {
            commands = commands.concat(Path.combine(shape.shapes).commands);
        }
    }
    return new Path(commands);
};

module.exports = Path;

},{"../objects/color":9,"../objects/rect":14,"../util/bezier":19,"../util/geo":21,"../util/math":23,"lodash":2}],13:[function(require,module,exports){
// 2-dimensional point object.

'use strict';

var Point = function (x, y) {
    this.x = x !== undefined ? x : 0;
    this.y = y !== undefined ? y : 0;
};

Object.defineProperty(Point.prototype, 'xy', {
    get: function () { return [this.x, this.y]; }
});

Point.ZERO = new Point(0, 0);

Point.read = function (x, y) {
    if (arguments.length === 2) { return new Point(x, y); }
    var arg = x;
    if (arg instanceof Point) {
        return arg;
    } else if (typeof arg === 'number') {
        return new Point(arg, arg);
    } else if (Array.isArray(arg)) {
        if (arg.length === 0) { return Point.ZERO; }
        x = arg[0];
        y = arg.length > 1 ? arg[1] : x;
        return new Point(x, y);
    } else if (arg.x !== undefined && arg.y !== undefined) {
        return new Point(arg.x, arg.y);
    } else {
        return Point.ZERO;
    }
};

Point.prototype.clone = function () {
    return new Point(this.x, this.y);
};

Point.prototype.add = function (v) {
    return new Point(this.x + v.x, this.y + v.y);
};

Point.prototype.subtract = Point.prototype.sub = function (v) {
    return new Point(this.x - v.x, this.y - v.y);
};

Point.prototype.divide = function (n) {
    return new Point(this.x / n, this.y / n);
};

Point.prototype.multiply = function (n) {
    return new Point(this.x * n, this.y * n);
};

Point.prototype.magnitude = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};

Point.prototype.magnitudeSquared = function () {
    return this.x * this.x + this.y * this.y;
};

Point.prototype.heading = function () {
    return Math.atan2(this.y, this.x);
};

Point.prototype.distanceTo = function (v) {
    var dx = this.x - v.x,
        dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
};

Point.prototype.normalize = function () {
    var m = this.magnitude();
    if (m !== 0) {
        return this.divide(m);
    } else {
        return Point.ZERO;
    }
};

Point.prototype.limit = function (speed) {
    if (this.magnitudeSquared() > speed * speed) {
        return this.normalize().multiply(speed);
    }
    return this;
};

Point.prototype.translate = function (tx, ty) {
    return new Point(this.x + tx, this.y + ty);
};

Point.prototype.scale = function (sx, sy) {
    sy = sy !== undefined ? sy : sx;
    return new Point(this.x * sx, this.y * sy);
};

Point.prototype.toString = function () {
    return '[' + this.x + ', ' + this.y + ']';
};

module.exports = Point;
},{}],14:[function(require,module,exports){
// Rectangle object

'use strict';

var Point = require('../objects/point');

var Rect = function (x, y, width, height) {
    this.x = x !== undefined ? x : 0;
    this.y = y !== undefined ? y : 0;
    this.width = width !== undefined ? width : 0;
    this.height = height !== undefined ? height : 0;
};

Object.defineProperty(Rect.prototype, 'xywh', {
    get: function () { return [this.x, this.y, this.width, this.height]; }
});

// Returns a new rectangle where width and height are guaranteed to be positive values.
Rect.prototype.normalize = function () {
    var x = this.x,
        y = this.y,
        width = this.width,
        height = this.height;

    if (width < 0) {
        x += width;
        width = -width;
    }

    if (height < 0) {
        y += height;
        height = -height;
    }
    return new Rect(x, y, width, height);
};

Rect.prototype.containsPoint = function (x, y) {
    if (arguments.length === 1) {
        y = x.y;
        x = x.x;
    }
    return (x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height);
};

Rect.prototype.containsRect = function (r) {
    return r.x >= this.x && r.x + r.width <= this.x + this.width &&
        r.y >= this.y && r.y + r.height <= this.y + this.height;
};

Rect.prototype.grow = function (dx, dy) {
    var x = this.x - dx,
        y = this.y - dy,
        width = this.width + dx * 2,
        height = this.height + dy * 2;
    return new Rect(x, y, width, height);
};

Rect.prototype.unite = function (r) {
    var x = Math.min(this.x, r.x),
        y = Math.min(this.y, r.y),
        width = Math.max(this.x + this.width, r.x + r.width) - x,
        height = Math.max(this.y + this.height, r.y + r.height) - y;
    return new Rect(x, y, width, height);
};

Rect.prototype.addPoint = function (x, y) {
    var dx, dy,
        _x = this.x,
        _y = this.y,
        width = this.width,
        height = this.height;

    if (x < this.x) {
        dx = this.x - x;
        _x = x;
        width += dx;
    } else if (x > this.x + this.width) {
        dx = x - (this.x + this.width);
        width += dx;
    }
    if (y < this.y) {
        dy = this.y - y;
        _y = y;
        height += dy;
    } else if (y > this.y + this.height) {
        dy = y - (this.y + this.height);
        height += dy;
    }
    return new Rect(_x, _y, width, height);
};

Rect.prototype.centerPoint = function () {
    return new Point(this.x + this.width / 2, this.y + this.height / 2);
};

module.exports = Rect;
},{"../objects/point":13}],15:[function(require,module,exports){
// Text object

// Internally the object is called "gText" to avoid conflicts with the DOM Text object.
// Externally it is exposed as g.Text.

'use strict';

var Color = require('../objects/color');
var Rect = require('../objects/rect');
var Transform = require('../objects/transform');

var _dummyContext = null;

// Generates a Text object.
// The function can take many possible argument forms, either by listing them in order
// (text, x, y, fontFamily, fontSize, align, fill), or by using an options object.
// The position can be specified as x, y; using a point {x: 10, y: 20} or using an array [10, 20].
// Here are a couple of ways to generate 'Hello' at position 0, 0 in 12pt Helvetica, centered.
//
//     new g.Text('Hello', {x: 0, y: 0}, 'Helvetica', 12, 'center');
//     new g.Text('Hello', [0, 0], {fontFamily: 'Helvetica', fontSize: 12, textAlign: 'center'});
//     new g.Text('Hello', 0, 0, {fontFamily: 'Helvetica', fontSize: 12});  // align: center is the default.
//     new g.Text('Hello', {fontFamily: 'Helvetica', fontSize: 12}); // the position defaults to 0,0.
var gText = function (text) {
    var args = Array.prototype.slice.call(arguments, 1),
        secondArg = arguments[1],
        thirdArg = arguments[2],
        lastArg = arguments[arguments.length - 1],
        options;

    // The text is required and always the first argument.
    this.text = String(text);

    // Second argument is position (as object or array) or x (as number).
    if (typeof secondArg === 'number') {
        this.x = secondArg;
        this.y = thirdArg;
        args = args.slice(2);
    } else if (Array.isArray(secondArg)) {
        this.x = secondArg[0];
        this.y = secondArg[1];
        args = args.slice(1);
    } else if (typeof secondArg === 'object') {
        this.x = secondArg.x !== undefined ? secondArg.x : 0;
        this.y = secondArg.y !== undefined ? secondArg.y : 0;
        args = args.slice(1);
    } else {
        this.x = 0;
        this.y = 0;
    }

    // The options object, if provided, is always the last argument.
    if (typeof lastArg === 'object') {
        options = lastArg;
        if (secondArg !== lastArg) {
            args = args.slice(0, args.length - 1);
        }
    } else {
        options = {};
    }

    if (args.length) {
        this.fontFamily = args.shift();
    } else {
        this.fontFamily = options.fontFamily || options.fontName || options.font || 'sans-serif';
    }

    if (args.length) {
        this.fontSize = args.shift();
    } else {
        this.fontSize = options.fontSize || 24;
    }

    if (args.length) {
        this.textAlign = args.shift();
    } else {
        this.textAlign = options.align || options.textAlign || 'left';
    }

    if (args.length) {
        this.fill = args.shift();
    } else {
        this.fill = options.fill || 'black';
    }

    this.transform = new Transform();
};

gText.prototype.clone = function () {
    var t = new gText();
    t.text = this.text;
    t.x = this.x;
    t.y = this.y;
    t.fontFamily = this.fontFamily;
    t.fontSize = this.fontSize;
    t.textAlign = this.textAlign;
    t.fill = Color.clone(this.fill);
    t.transform = this.transform;
    return t;
};

// The `measureWidth` function requires a canvas, so we set up a dummy one
// that we re-use for the duration of the page.
gText._getDummyContext = function () {
    if (!_dummyContext) {
        if (typeof document !== 'undefined') {
            _dummyContext = document.createElement('canvas').getContext('2d');
        } else {
            // For node.js, use a fake context that estimates the width.
            _dummyContext = {
                font: '10px sans-serif',
                measureText: function (text) {
                    var fontSize = parseFloat(this.font);
                    // The 0.6 is the average width / fontSize ratio across all characters and font sizes.
                    return {width: text.length * fontSize * 0.6};
                }
            };
        }
    }
    return _dummyContext;
};

gText.prototype._getFont = function () {
    return this.fontSize + 'px ' + this.fontFamily;
};

gText.prototype.colorize = function (fill) {
    var t = this.clone();
    t.fill = Color.clone(fill);
    return t;
};

gText.prototype.draw = function (ctx) {
    ctx.save();
    ctx.font = this._getFont();
    ctx.textAlign = this.textAlign;
    var m = this.transform.m;
    ctx.transform(m[0], m[1], m[3], m[4], m[6], m[7]);
    ctx.fillStyle = Color.toCSS(this.fill);
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
};

gText.prototype.bounds = function () {
    var ctx = gText._getDummyContext(),
        metrics,
        x = this.x;
    ctx.font = this._getFont();
    // FIXME: measureText returns a TextMetrics object that only contains width.
    metrics = ctx.measureText(this.text);
    if (this.textAlign === 'center') {
        x = this.x - (metrics.width / 2);
    } else if (this.textAlign === 'right') {
        x = this.x - metrics.width;
    }
    return new Rect(x, this.y - this.fontSize, metrics.width, this.fontSize * 1.2);
};

gText.prototype.toSVG = function () {
    var svg = '<text';
    svg += ' x="' + this.x + '"';
    svg += ' y="' + this.y + '"';
    svg += ' font-family="' + this.fontFamily + '"';
    svg += ' font-size="' + this.fontSize + '"';
    var textAnchor;
    if (this.textAlign === 'left') {
        textAnchor = 'start';
    } else if (this.textAlign === 'center') {
        textAnchor = 'middle';
    } else if (this.textAlign === 'right') {
        textAnchor = 'end';
    }
    svg += ' text-anchor="' + textAnchor + '"';
    if (this.fill !== 'black') {
        svg += ' fill="' + Color.toCSS(this.fill) + '"';
    }
    svg += '>';
    svg += this.text;
    svg += '</text>';
    return svg;
};

module.exports = gText;
},{"../objects/color":9,"../objects/rect":14,"../objects/transform":16}],16:[function(require,module,exports){
// 2-dimensional transformation matrix

'use strict';

var _ = require('lodash');

var bezier = require('../util/bezier');
var math = require('../util/math');

var Group = require('../objects/group');
var Path = require('../objects/path');
var Point = require('../objects/point');

var MOVETO  = bezier.MOVETO;
var LINETO  = bezier.LINETO;
var QUADTO  = bezier.QUADTO;
var CURVETO = bezier.CURVETO;
var CLOSE   = bezier.CLOSE;

// A geometric transformation in Euclidean space (i.e. 2D)
// that preserves collinearity and ratio of distance between points.
// Linear transformations include rotation, translation, scaling, shear.
var Transform = function (m) {
    if (m !== undefined) {
        this.m = m;
    } else {
        this.m = [1, 0, 0, 0, 1, 0, 0, 0, 1]; // Identity matrix.
    }
};

Transform.IDENTITY = new Transform();

Transform.identity = function () {
    return new Transform();
};

// Returns the 3x3 matrix multiplication of A and B.
// Note that scale(), translate(), rotate() work with premultiplication,
// e.g. the matrix A followed by B = BA and not AB.
Transform._mmult = function (a, b) {
    if (a.m !== undefined) { a = a.m; }
    if (b.m !== undefined) { b = b.m; }

    return new Transform([
        a[0] * b[0] + a[1] * b[3],
        a[0] * b[1] + a[1] * b[4], 0,
        a[3] * b[0] + a[4] * b[3],
        a[3] * b[1] + a[4] * b[4], 0,
        a[6] * b[0] + a[7] * b[3] + b[6],
        a[6] * b[1] + a[7] * b[4] + b[7], 1
    ]);
};

Transform.prototype.prepend = function (matrix) {
    return Transform._mmult(this.m, matrix.m);
};

Transform.prototype.append = function (matrix) {
    return Transform._mmult(matrix.m, this.m);
};

Transform.prototype.inverse = function () {
    var m = this.m,
        d = m[0] * m[4] - m[1] * m[3];
    return new Transform([
        m[4] / d,
        -m[1] / d, 0,
        -m[3] / d,
        m[0] / d, 0,
        (m[3] * m[7] - m[4] * m[6]) / d,
        -(m[0] * m[7] - m[1] * m[6]) / d, 1
    ]);
};

Transform.prototype.scale = function (x, y) {
    if (y === undefined) { y = x; }
    return Transform._mmult([x, 0, 0, 0, y, 0, 0, 0, 1], this.m);
};

Transform.prototype.translate = function (x, y) {
    return Transform._mmult([1, 0, 0, 0, 1, 0, x, y, 1], this.m);
};

Transform.prototype.rotate = function (angle) {
    var c = Math.cos(math.radians(angle)),
        s = Math.sin(math.radians(angle));
    return Transform._mmult([c, s, 0, -s, c, 0, 0, 0, 1], this.m);
};

Transform.prototype.skew = function (x, y) {
    var kx = Math.PI * x / 180.0,
        ky = Math.PI * y / 180.0;
    return Transform._mmult([1, Math.tan(ky), 0, -Math.tan(kx), 1, 0, 0, 0, 1], this.m);
};

// Returns the new coordinates of the given point (x,y) after transformation.
Transform.prototype.transformPoint = function (point) {
    var x = point.x,
        y = point.y,
        m = this.m;
    return new Point(
        x * m[0] + y * m[3] + m[6],
        x * m[1] + y * m[4] + m[7]
    );
};

Transform.prototype.transformPoints = function (points) {
    var _this = this;
    return _.map(points, function (pt) {
        return _this.transformPoint(pt);
    });
};

Transform.prototype.transformPath = function (path) {
    var _this = this,
        point,
        ctrl1,
        ctrl2,
        commands = _.map(path.commands, function (cmd) {
            if (cmd.type === MOVETO) {
                point = _this.transformPoint({x: cmd.x, y: cmd.y});
                return { type: MOVETO, x: point.x, y: point.y };
            } else if (cmd.type === LINETO) {
                point = _this.transformPoint({x: cmd.x, y: cmd.y});
                return { type: LINETO, x: point.x, y: point.y };
            } else if (cmd.type === QUADTO) {
                point = _this.transformPoint({x: cmd.x, y: cmd.y});
                ctrl1 = _this.transformPoint({x: cmd.x1, y: cmd.y1});
                return { type: QUADTO, x1: ctrl1.x, y1: ctrl1.y, x: point.x, y: point.y };
            } else if (cmd.type === CURVETO) {
                point = _this.transformPoint({x: cmd.x, y: cmd.y});
                ctrl1 = _this.transformPoint({x: cmd.x1, y: cmd.y1});
                ctrl2 = _this.transformPoint({x: cmd.x2, y: cmd.y2});
                return { type: CURVETO, x1: ctrl1.x, y1: ctrl1.y, x2: ctrl2.x, y2: ctrl2.y, x: point.x, y: point.y };
            } else if (cmd.type === CLOSE) {
                return cmd;
            } else {
                throw new Error('Unknown command type ' + cmd);
            }
        });
    return new Path(commands, path.fill, path.stroke, path.strokeWidth);
};

Transform.prototype.transformText = function (text) {
    var t = text.clone();
    t.transform = this.append(t.transform);
    return t;
};

Transform.prototype.transformGroup = function (group) {
    var _this = this,
        shapes = _.map(group.shapes, function (shape) {
            return _this.transformShape(shape);
        });
    return new Group(shapes);
};

Transform.prototype.transformShape = function (shape) {
    var fn;
    if (shape.shapes) {
        fn = this.transformGroup;
    } else if (shape.commands) {
        fn = this.transformPath;
    } else if (shape.text) {
        fn = this.transformText;
    } else if (shape.x !== undefined && shape.y !== undefined) {
        fn = this.transformPoint;
    } else if (shape._transform !== undefined) {
        return shape._transform(this.m);
    } else if (Array.isArray(shape) && shape.length > 0) {
        if (shape[0].x !== undefined && shape[0].y !== undefined) {
            fn = this.transformPoints;
        } else {
            var l = [];
            for (var i = 0; i < shape.length; i += 1) {
                l.push(this.transformShape(shape[i]));
            }
            return l;
        }
    } else {
        throw new Error('Don\'t know how to transform ' + shape);
    }
    return fn.call(this, shape);
};

module.exports = Transform;

},{"../objects/group":10,"../objects/path":12,"../objects/point":13,"../util/bezier":19,"../util/math":23,"lodash":2}],17:[function(require,module,exports){
// Mixin for Path and Group

'use strict';

var Point = require('../objects/point');
var Transform = require('../objects/transform');

var Transformable = {
    translate: function (position) {
        if (!position) { position = Point.ZERO; }
        var t = new Transform().translate(position.x, position.y);
        return t.transformShape(this);
    },

    scale: function (scale, origin) {
        if (!origin) { origin = Point.ZERO; }
        var sx, sy;
        if (typeof scale === 'number') {
            sx = scale;
            sy = scale;
        } else {
            sx = scale.x;
            sy = scale.y;
        }
        var t = new Transform();
        t = t.translate(origin.x, origin.y);
        t = t.scale(sx, sy);
        t = t.translate(-origin.x, -origin.y);
        return t.transformShape(this);
    },

    rotate: function (angle, origin) {
        if (!origin) { origin = Point.ZERO; }
        var t = new Transform();
        t = t.translate(origin.x, origin.y);
        t = t.rotate(angle);
        t = t.translate(-origin.x, -origin.y);
        return t.transformShape(this);
    },

    skew: function (skew, origin) {
        if (!origin) { origin = Point.ZERO; }
        var t = new Transform();
        t = t.translate(origin.x, origin.y);
        t = t.skew(skew.x, skew.y);
        t = t.translate(-origin.x, -origin.y);
        return t.transformShape(this);
    }
};

module.exports = Transformable;

},{"../objects/point":13,"../objects/transform":16}],18:[function(require,module,exports){
//// VECTORS AND MATRICES ///////////////////////////////////////////////

'use strict';

var Vec3 = function (x, y, z) {
    this.x = x === undefined ? 0 : x;
    this.y = y === undefined ? 0 : y;
    this.z = z === undefined ? 0 : z;
};

// Generate the zero vector.
Vec3.ZERO = new Vec3(0, 0, 0);

Vec3.up = function () {
    return new Vec3(0, 1.0, 0);
};

// Generate the dot product of two vectors.
Vec3.dot = function (a, b) {
    return (a.x * b.x + a.y * b.y + a.z * b.z);
};

// Generate the cross product of two vectors.
Vec3.cross = function (a, b) {
    return new Vec3(
        a.y * b.z - a.z * b.y,
        a.z * b.x - a.x * b.z,
        a.x * b.y - a.y * b.x
    );
};

// Convert this vector to a string representation.
Vec3.prototype.toString = function () {
    return '[' + this.x + ', ' + this.y + ', ' + this.z + ']';
};

// Convert this vector to an array.
Vec3.prototype.toArray = function () {
    var array = [];
    array.push(this.x);
    array.push(this.y);
    array.push(this.z);
    return array;
};

// Calculate the length of this vector.
Vec3.prototype.getLength = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

// Create a new vector that is this vector, normalized.
Vec3.prototype.normalize = function () {
    var len, c;
    len = this.getLength();
    if (len === 0) {
        return this;
    }
    c = 1.0 / len;
    return new Vec3(this.x * c, this.y * c, this.z * c);
};

// Create a new vector that is the addition of this vector and the given vector.
Vec3.prototype.add = function (o) {
    return new Vec3(this.x + o.x, this.y + o.y, this.z + o.z);
};

// Create a new vector that is the subtraction of this vector and the given vector.
Vec3.prototype.subtract = function (o) {
    return new Vec3(this.x - o.x, this.y - o.y, this.z - o.z);
};

// Transform the vector according to the matrix and return the result.
// A new vector is created, nothing is modified.
Vec3.prototype.transform = function (matrix4) {
    var x, y, z, w, matrix;

    matrix = matrix4;
    x = (this.x * matrix.m[0]) + (this.y * matrix.m[4]) + (this.z * matrix.m[8]) + matrix.m[12];
    y = (this.x * matrix.m[1]) + (this.y * matrix.m[5]) + (this.z * matrix.m[9]) + matrix.m[13];
    z = (this.x * matrix.m[2]) + (this.y * matrix.m[6]) + (this.z * matrix.m[10]) + matrix.m[14];
    w = (this.x * matrix.m[3]) + (this.y * matrix.m[7]) + (this.z * matrix.m[11]) + matrix.m[15];

    return new Vec3(x / w, y / w, z / w);
};

module.exports = Vec3;
},{}],19:[function(require,module,exports){
// Bézier Math
// Thanks to Prof. F. De Smedt at the Vrije Universiteit Brussel, 2006.

'use strict';

var _ = require('lodash');

var math = require('../util/math');

var Point = require('../objects/point');
var Rect = require('../objects/rect');

var bezier = {};

var MOVETO = bezier.MOVETO = 'M';
var LINETO = bezier.LINETO = 'L';
bezier.QUADTO = 'Q';
var CURVETO = bezier.CURVETO = 'C';
var CLOSE = bezier.CLOSE = 'Z';

// BEZIER MATH:

// Returns coordinates for the point at t (0.0-1.0) on the line.
bezier.linePoint = function (t, x0, y0, x1, y1) {
    var x = x0 + t * (x1 - x0),
        y = y0 + t * (y1 - y0);
    return { type: LINETO, x: x, y: y };
};

// Returns the length of the line.
bezier.lineLength = function (x0, y0, x1, y1) {
    var a = Math.pow(Math.abs(x0 - x1), 2),
        b = Math.pow(Math.abs(y0 - y1), 2);
    return Math.sqrt(a + b);
};

// Returns coordinates for the point at t (0.0-1.0) on the curve
// (de Casteljau interpolation algorithm).
bezier.curvePoint = function (t, x0, y0, x1, y1, x2, y2, x3, y3) {
    var dt = 1 - t,
        x01 = x0 * dt + x1 * t,
        y01 = y0 * dt + y1 * t,
        x12 = x1 * dt + x2 * t,
        y12 = y1 * dt + y2 * t,
        x23 = x2 * dt + x3 * t,
        y23 = y2 * dt + y3 * t,

        h1x = x01 * dt + x12 * t,
        h1y = y01 * dt + y12 * t,
        h2x = x12 * dt + x23 * t,
        h2y = y12 * dt + y23 * t,
        x = h1x * dt + h2x * t,
        y = h1y * dt + h2y * t;
    return { type: CURVETO, x1: h1x, y1: h1y, x2: h2x, y2: h2y, x: x, y: y };
};

// Returns the length of the curve.
// Integrates the estimated length of the cubic bezier spline defined by x0, y0, ... x3, y3,
// by adding up the length of n linear lines along the curve.
bezier.curveLength = function (x0, y0, x1, y1, x2, y2, x3, y3, n) {
    if (n === undefined) { n = 20; }
    var i, t, cmd,
        length = 0,
        xi = x0,
        yi = y0;
    for (i = 0; i < n; i += 1) {
        t = (i + 1) / n;
        cmd = bezier.curvePoint(t, x0, y0, x1, y1, x2, y2, x3, y3);
        length += Math.sqrt(
            Math.pow(Math.abs(xi - cmd.x), 2) +
                Math.pow(Math.abs(yi - cmd.y), 2)
        );
        xi = cmd.x;
        yi = cmd.y;
    }
    return length;
};

// BEZIER PATH LENGTH:

// Returns an array with the length of each command in the path.
// With relative=true, the total length of all commands is 1.0.
bezier.segmentLengths = function (commands, relative, n) {
    relative = relative !== undefined ? relative : false;
    if (n === undefined) { n = 20; }
    var i, cmd, type, closeX, closeY, x0, y0, s, lengths;
    lengths = [];
    for (i = 0; i < commands.length; i += 1) {
        cmd = commands[i];
        type = cmd.type;

        if (i === 0) {
            closeX = cmd.x;
            closeY = cmd.y;
        } else if (type === MOVETO) {
            closeX = cmd.x;
            closeY = cmd.y;
            lengths.push(0.0);
        } else if (type === CLOSE) {
            lengths.push(bezier.lineLength(x0, y0, closeX, closeY));
        } else if (type === LINETO) {
            lengths.push(bezier.lineLength(x0, y0, cmd.x, cmd.y));
        } else if (type === CURVETO) {
            lengths.push(bezier.curveLength(x0, y0, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y, n));
        }
        if (type !== CLOSE) {
            x0 = cmd.x;
            y0 = cmd.y;
        }
    }
    if (relative === true) {
        s = math.sum(lengths);
        return (s > 0) ?
                _.map(lengths, function (v) { return v / s; }) :
                _.map(lengths, function () { return 0.0; });
    }
    return lengths;
};

// Returns the approximate length of the path.
// Calculates the length of each curve in the path using n linear samples.
bezier.length = function (path, n) {
    n = n || 20;
    return math.sum(bezier.segmentLengths(path.commands, false, n));
};

// BEZIER PATH POINT:

// For a given relative t on the path (0.0-1.0), returns an array [index, t, PathElement],
// with the index of the PathElement before t, the absolute position on this segment,
// the last MOVETO or any subsequent CLOSE commands after i.
// Note: during iteration, supplying segment lengths yourself is 30x faster.
bezier._locate = function (path, t, segmentLengths) {
    var i, cmd, closeTo;
    if (segmentLengths === undefined) {
        segmentLengths = bezier.segmentLengths(path.commands, true);
    }
    for (i = 0; i < path.commands.length; i += 1) {
        cmd = path.commands[i];
        if (i === 0 || cmd.type === MOVETO) {
            closeTo =  new Point(cmd.x, cmd.y);
        }
        if (t <= segmentLengths[i] || i === segmentLengths.length - 1) {
            break;
        }
        t -= segmentLengths[i];
    }
    if (segmentLengths[i] !== 0) { t /= segmentLengths[i]; }
    if (i === segmentLengths.length - 1 && segmentLengths[i] === 0) { i -= 1; }
    return [i, t, closeTo];
};

// Returns the DynamicPathElement at time t on the path.
// Note: in PathElement, ctrl1 is how the curve started, and ctrl2 how it arrives in this point.
// Here, ctrl1 is how the curve arrives, and ctrl2 how it continues to the next point.
bezier.point = function (path, t, segmentLengths) {
    var loc, i, closeTo, x0, y0, cmd;
    loc = bezier._locate(path, t, segmentLengths);
    i = loc[0];
    t = loc[1];
    closeTo = loc[2];
    x0 = path.commands[i].x;
    y0 = path.commands[i].y;
    cmd = path.commands[i + 1];
    if (cmd.type === LINETO || cmd.type === CLOSE) {
        cmd = (cmd.type === CLOSE) ?
                 bezier.linePoint(t, x0, y0, closeTo.x, closeTo.y) :
                 bezier.linePoint(t, x0, y0, cmd.x, cmd.y);
    } else if (cmd.type === CURVETO) {
        cmd = bezier.curvePoint(t, x0, y0, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
    }
    return cmd;
};

bezier.extrema = function (x1, y1, x2, y2, x3, y3, x4, y4) {
    var minX, maxX, minY, maxY,
        ax, bx, cx, ay, by, cy,
        temp, rcp, tx, ty;


    function fuzzyCompare(p1, p2) {
        return Math.abs(p1 - p2) <= (0.000000000001 * Math.min(Math.abs(p1), Math.abs(p2)));
    }

    function coefficients(t) {
        var mT, a, b, c, d;
        mT = 1 - t;
        b = mT * mT;
        c = t * t;
        d = c * t;
        a = b * mT;
        b *= (3.0 * t);
        c *= (3.0 * mT);
        return [a, b, c, d];
    }

    function pointAt(t) {
        var a, b, c, d, coeff;
        coeff = coefficients(t);
        a = coeff[0];
        b = coeff[1];
        c = coeff[2];
        d = coeff[3];
        return {x: a * x1 + b * x2 + c * x3 + d * x4,
                y: a * y1 + b * y2 + c * y3 + d * y4};
    }

    function bezierCheck(t) {
        if (t >= 0 && t <= 1) {
            var p = pointAt(t);
            if (p.x < minX) {
                minX = p.x;
            } else if (p.x > maxX) {
                maxX = p.x;
            }
            if (p.y < minY) {
                minY = p.y;
            } else if (p.y > maxY) {
                maxY = p.y;
            }
        }
    }

    if (x1 < x4) {
        minX = x1;
        maxX = x4;
    } else {
        minX = x4;
        maxX = x1;
    }
    if (y1 < y4) {
        minY = y1;
        maxY = y4;
    } else {
        minY = y4;
        maxY = y1;
    }

    ax = 3 * (-x1 + 3 * x2 - 3 * x3 + x4);
    bx = 6 * (x1 - 2 * x2 + x3);
    cx = 3 * (-x1 + x2);

    if (fuzzyCompare(ax + 1, 1)) {
        if (!fuzzyCompare(bx + 1, 1)) {
            bezierCheck(-cx / bx);
        }
    } else {
        tx = bx * bx - 4 * ax * cx;
        if (tx >= 0) {
            temp = Math.sqrt(tx);
            rcp = 1 / (2 * ax);
            bezierCheck((-bx + temp) * rcp);
            bezierCheck((-bx - temp) * rcp);
        }
    }

    ay = 3 * (-y1 + 3 * y2 - 3 * y3 + y4);
    by = 6 * (y1 - 2 * y2 + y3);
    cy = 3 * (-y1 + y2);

    if (fuzzyCompare(ay + 1, 1)) {
        if (!fuzzyCompare(by + 1, 1)) {
            bezierCheck(-cy / by);
        }
    } else {
        ty = by * by - 4 * ay * cy;
        if (ty > 0) {
            temp = Math.sqrt(ty);
            rcp = 1 / (2 * ay);
            bezierCheck((-by + temp) * rcp);
            bezierCheck((-by - temp) * rcp);
        }
    }

    return new Rect(minX, minY, maxX - minX, maxY - minY);
};

module.exports = bezier;

},{"../objects/point":13,"../objects/rect":14,"../util/math":23,"lodash":2}],20:[function(require,module,exports){
// Color conversion functions

'use strict';

var color = {};

color.namedColors = {
    'lightpink'            : [1.00, 0.71, 0.76],
    'pink'                 : [1.00, 0.75, 0.80],
    'crimson'              : [0.86, 0.08, 0.24],
    'lavenderblush'        : [1.00, 0.94, 0.96],
    'palevioletred'        : [0.86, 0.44, 0.58],
    'hotpink'              : [1.00, 0.41, 0.71],
    'deeppink'             : [1.00, 0.08, 0.58],
    'mediumvioletred'      : [0.78, 0.08, 0.52],
    'orchid'               : [0.85, 0.44, 0.84],
    'thistle'              : [0.85, 0.75, 0.85],
    'plum'                 : [0.87, 0.63, 0.87],
    'violet'               : [0.93, 0.51, 0.93],
    'fuchsia'              : [1.00, 0.00, 1.00],
    'darkmagenta'          : [0.55, 0.00, 0.55],
    'purple'               : [0.50, 0.00, 0.50],
    'mediumorchid'         : [0.73, 0.33, 0.83],
    'darkviolet'           : [0.58, 0.00, 0.83],
    'darkorchid'           : [0.60, 0.20, 0.80],
    'indigo'               : [0.29, 0.00, 0.51],
    'blueviolet'           : [0.54, 0.17, 0.89],
    'mediumpurple'         : [0.58, 0.44, 0.86],
    'mediumslateblue'      : [0.48, 0.41, 0.93],
    'slateblue'            : [0.42, 0.35, 0.80],
    'darkslateblue'        : [0.28, 0.24, 0.55],
    'ghostwhite'           : [0.97, 0.97, 1.00],
    'lavender'             : [0.90, 0.90, 0.98],
    'blue'                 : [0.00, 0.00, 1.00],
    'mediumblue'           : [0.00, 0.00, 0.80],
    'darkblue'             : [0.00, 0.00, 0.55],
    'navy'                 : [0.00, 0.00, 0.50],
    'midnightblue'         : [0.10, 0.10, 0.44],
    'royalblue'            : [0.25, 0.41, 0.88],
    'cornflowerblue'       : [0.39, 0.58, 0.93],
    'lightsteelblue'       : [0.69, 0.77, 0.87],
    'lightslategray'       : [0.47, 0.53, 0.60],
    'slategray'            : [0.44, 0.50, 0.56],
    'dodgerblue'           : [0.12, 0.56, 1.00],
    'aliceblue'            : [0.94, 0.97, 1.00],
    'steelblue'            : [0.27, 0.51, 0.71],
    'lightskyblue'         : [0.53, 0.81, 0.98],
    'skyblue'              : [0.53, 0.81, 0.92],
    'deepskyblue'          : [0.00, 0.75, 1.00],
    'lightblue'            : [0.68, 0.85, 0.90],
    'powderblue'           : [0.69, 0.88, 0.90],
    'cadetblue'            : [0.37, 0.62, 0.63],
    'darkturquoise'        : [0.00, 0.81, 0.82],
    'azure'                : [0.94, 1.00, 1.00],
    'lightcyan'            : [0.88, 1.00, 1.00],
    'paleturquoise'        : [0.69, 0.93, 0.93],
    'aqua'                 : [0.00, 1.00, 1.00],
    'darkcyan'             : [0.00, 0.55, 0.55],
    'teal'                 : [0.00, 0.50, 0.50],
    'darkslategray'        : [0.18, 0.31, 0.31],
    'mediumturquoise'      : [0.28, 0.82, 0.80],
    'lightseagreen'        : [0.13, 0.70, 0.67],
    'turquoise'            : [0.25, 0.88, 0.82],
    'aquamarine'           : [0.50, 1.00, 0.83],
    'mediumaquamarine'     : [0.40, 0.80, 0.67],
    'mediumspringgreen'    : [0.00, 0.98, 0.60],
    'mintcream'            : [0.96, 1.00, 0.98],
    'springgreen'          : [0.00, 1.00, 0.50],
    'mediumseagreen'       : [0.24, 0.70, 0.44],
    'seagreen'             : [0.18, 0.55, 0.34],
    'honeydew'             : [0.94, 1.00, 0.94],
    'darkseagreen'         : [0.56, 0.74, 0.56],
    'palegreen'            : [0.60, 0.98, 0.60],
    'lightgreen'           : [0.56, 0.93, 0.56],
    'limegreen'            : [0.20, 0.80, 0.20],
    'lime'                 : [0.00, 1.00, 0.00],
    'forestgreen'          : [0.13, 0.55, 0.13],
    'green'                : [0.00, 0.50, 0.00],
    'darkgreen'            : [0.00, 0.39, 0.00],
    'lawngreen'            : [0.49, 0.99, 0.00],
    'chartreuse'           : [0.50, 1.00, 0.00],
    'greenyellow'          : [0.68, 1.00, 0.18],
    'darkolivegreen'       : [0.33, 0.42, 0.18],
    'yellowgreen'          : [0.60, 0.80, 0.20],
    'olivedrab'            : [0.42, 0.56, 0.14],
    'ivory'                : [1.00, 1.00, 0.94],
    'beige'                : [0.96, 0.96, 0.86],
    'lightyellow'          : [1.00, 1.00, 0.88],
    'lightgoldenrodyellow' : [0.98, 0.98, 0.82],
    'yellow'               : [1.00, 1.00, 0.00],
    'olive'                : [0.50, 0.50, 0.00],
    'darkkhaki'            : [0.74, 0.72, 0.42],
    'palegoldenrod'        : [0.93, 0.91, 0.67],
    'lemonchiffon'         : [1.00, 0.98, 0.80],
    'khaki'                : [0.94, 0.90, 0.55],
    'gold'                 : [1.00, 0.84, 0.00],
    'cornsilk'             : [1.00, 0.97, 0.86],
    'goldenrod'            : [0.85, 0.65, 0.13],
    'darkgoldenrod'        : [0.72, 0.53, 0.04],
    'floralwhite'          : [1.00, 0.98, 0.94],
    'oldlace'              : [0.99, 0.96, 0.90],
    'wheat'                : [0.96, 0.87, 0.07],
    'orange'               : [1.00, 0.65, 0.00],
    'moccasin'             : [1.00, 0.89, 0.71],
    'papayawhip'           : [1.00, 0.94, 0.84],
    'blanchedalmond'       : [1.00, 0.92, 0.80],
    'navajowhite'          : [1.00, 0.87, 0.68],
    'antiquewhite'         : [0.98, 0.92, 0.84],
    'tan'                  : [0.82, 0.71, 0.55],
    'burlywood'            : [0.87, 0.72, 0.53],
    'darkorange'           : [1.00, 0.55, 0.00],
    'bisque'               : [1.00, 0.89, 0.77],
    'linen'                : [0.98, 0.94, 0.90],
    'peru'                 : [0.80, 0.52, 0.25],
    'peachpuff'            : [1.00, 0.85, 0.73],
    'sandybrown'           : [0.96, 0.64, 0.38],
    'chocolate'            : [0.82, 0.41, 0.12],
    'saddlebrown'          : [0.55, 0.27, 0.07],
    'seashell'             : [1.00, 0.96, 0.93],
    'sienna'               : [0.63, 0.32, 0.18],
    'lightsalmon'          : [1.00, 0.63, 0.48],
    'coral'                : [1.00, 0.50, 0.31],
    'orangered'            : [1.00, 0.27, 0.00],
    'darksalmon'           : [0.91, 0.59, 0.48],
    'tomato'               : [1.00, 0.39, 0.28],
    'salmon'               : [0.98, 0.50, 0.45],
    'mistyrose'            : [1.00, 0.89, 0.88],
    'lightcoral'           : [0.94, 0.50, 0.50],
    'snow'                 : [1.00, 0.98, 0.98],
    'rosybrown'            : [0.74, 0.56, 0.56],
    'indianred'            : [0.80, 0.36, 0.36],
    'red'                  : [1.00, 0.00, 0.00],
    'brown'                : [0.65, 0.16, 0.16],
    'firebrick'            : [0.70, 0.13, 0.13],
    'darkred'              : [0.55, 0.00, 0.00],
    'maroon'               : [0.50, 0.00, 0.00],
    'white'                : [1.00, 1.00, 1.00],
    'whitesmoke'           : [0.96, 0.96, 0.96],
    'gainsboro'            : [0.86, 0.86, 0.86],
    'lightgrey'            : [0.83, 0.83, 0.83],
    'silver'               : [0.75, 0.75, 0.75],
    'darkgray'             : [0.66, 0.66, 0.66],
    'gray'                 : [0.50, 0.50, 0.50],
    'grey'                 : [0.50, 0.50, 0.50],
    'dimgray'              : [0.41, 0.41, 0.41],
    'dimgrey'              : [0.41, 0.41, 0.41],
    'black'                : [0.00, 0.00, 0.00],
    'cyan'                 : [0.00, 0.68, 0.94],

    'transparent'          : [0.00, 0.00, 0.00, 0.00],
    'bark'                 : [0.25, 0.19, 0.13]
};

function toHex(i) {
    var s;
    if (i === 0) {
        return '00';
    } else {
        s = i.toString(16).toUpperCase();
        if (s.length < 2) {
            s = '0' + s;
        }
        return s;
    }
}

// Converts the given R,G,B values to a hexadecimal color string.
color.rgb2hex = function (r, g, b) {
    return '#' +
        toHex(Math.round(r * 255)) +
        toHex(Math.round(g * 255)) +
        toHex(Math.round(b * 255));
};

// Converts the given R,G,B,A values to a hexadecimal color string.
color.rgba2hex = function (r, g, b, a) {
    return '#' +
        toHex(Math.round(r * 255)) +
        toHex(Math.round(g * 255)) +
        toHex(Math.round(b * 255)) +
        toHex(Math.round(a * 255));
};

// Converts the given hexadecimal color string to R,G,B (between 0.0-1.0).
color.hex2rgb = function (hex) {
    var arr, r, g, b;
    hex = hex.replace(/^#/, '');
    if (hex.length < 6) { // hex += hex[-1] * (6-hex.length);
        arr = [];
        arr.length = 6 - hex.length;
        hex += arr.join(hex.substr(hex.length - 1));
    }
    r = parseInt(hex.substr(0, 2), 16) / 255;
    g = parseInt(hex.substr(2, 2), 16) / 255;
    b = parseInt(hex.substr(4, 2), 16) / 255;
    return [r, g, b];
};

// Converts the given R,G,B values to H,S,B (between 0.0-1.0).
color.rgb2hsb = function (r, g, b) {
    var h = 0,
        s = 0,
        v = Math.max(r, g, b),
        d = v - Math.min(r, g, b);
    if (v !== 0) {
        s = d / v;
    }
    if (s !== 0) {
        if (r === v) {
            h = 0 + (g - b) / d;
        } else if (g === v) {
            h = 2 + (b - r) / d;
        } else {
            h = 4 + (r - g) / d;
        }
    }
    h = h * (60 / 360);
    if (h < 0) {
        h += 1.0;
    }
    return [h, s, v];
};

// Converts the given H,S,B color values to R,G,B (between 0.0-1.0).
color.hsb2rgb = function (h, s, v) {
    if (s === 0) {
        return [v, v, v];
    }
    h = h % 1 * 6.0;
    var i = Math.floor(h),
        f = h - i,
        x = v * (1 - s),
        y = v * (1 - s * f),
        z = v * (1 - s * (1 - f));
    if (i > 4) {
        return [v, x, y];
    }
    return [[v, z, x], [y, v, x], [x, v, z], [x, y, v], [z, x, v]][parseInt(i, 10)];
};

// Converts the given R,G,B values to H,S,L (between 0.0-1.0).
// Code adapted from http://github.com/mattdesl/float-rgb2hsl
color.rgb2hsl = function (r, g, b) {
    var min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        delta = max - min,
        h, s, l;

    if (max === min) {
        h = 0;
    } else if (r === max) {
        h = (g - b) / delta;
    } else if (g === max) {
        h = 2 + (b - r) / delta;
    } else if (b === max) {
        h = 4 + (r - g) / delta;
    }

    h = Math.min(h * 60, 360);

    if (h < 0) {
        h += 360;
    }

    l = (min + max) / 2;

    if (max === min) {
        s = 0;
    } else if (l <= 0.5) {
        s = delta / (max + min);
    } else {
        s = delta / (2 - max - min);
    }

    return [h / 360, s, l];
};

// Converts the given H,S,L color values to R,G,B (between 0.0-1.0).
// Code adapted from http://github.com/mattdesl/float-hsl2rgb
color.hsl2rgb = function (h, s, l) {
    var t1, t2, t3, rgb, val;

    if (s === 0) {
        val = l;
        return [val, val, val];
    }

    if (l < 0.5) {
        t2 = l * (1 + s);
    } else {
        t2 = l + s - l * s;
    }
    t1 = 2 * l - t2;

    rgb = [0, 0, 0];
    for (var i = 0; i < 3; i++) {
        t3 = h + 1 / 3 * -(i - 1);
        if (t3 < 0) {
            t3 += 1;
        }
        if (t3 > 1) {
            t3 -= 1;
        }

        if (6 * t3 < 1) {
            val = t1 + (t2 - t1) * 6 * t3;
        } else if (2 * t3 < 1) {
            val = t2;
        } else if (3 * t3 < 2) {
            val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
        } else {
            val = t1;
        }

        rgb[i] = val;
    }

    return rgb;
};

module.exports = color;

},{}],21:[function(require,module,exports){
// Geometry

'use strict';

var math = require('../util/math');

var Point = require('../objects/point');

var geo = {};

// Returns the angle between two points.
geo.angle = function (x0, y0, x1, y1) {
    return math.degrees(Math.atan2(y1 - y0, x1 - x0));
};

// Returns the distance between two points.
geo.distance = function (x0, y0, x1, y1) {
    return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
};

// Returns the location of a point by rotating around origin (x0,y0).
geo.coordinates = function (x0, y0, angle, distance) {
    var x = x0 + Math.cos(math.radians(angle)) * distance,
        y = y0 + Math.sin(math.radians(angle)) * distance;
    return new Point(x, y);
};


// Determines if the given point is within the polygon, given as a list of points.

// This function uses a ray casting algorithm to determine how many times
// a horizontal ray starting from the point intersects with the sides of the polygon.
// If it is an even number of times, the point is outside, if odd, inside.
// The algorithm does not always report correctly when the point is very close to the boundary.
// The polygon is passed as an array of Points.
//
// Based on: W. Randolph Franklin, 1970, http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
geo.pointInPolygon = function (points, x, y) {
    var i, j, x0, y0, x1, y1,
        odd = false,
        n = points.length;

    for (i = 0; i < n; i += 1) {
        j = (i < n - 1) ? i + 1 : 0;
        x0 = points[i].x;
        y0 = points[i].y;
        x1 = points[j].x;
        y1 = points[j].y;
        if ((y0 < y && y1 >= y) || (y1 < y && y0 >= y)) {
            if (x0 + (y - y0) / (y1 - y0) * (x1 - x0) < x) {
                odd = !odd;
            }
        }
    }
    return odd;
};

module.exports = geo;

},{"../objects/point":13,"../util/math":23}],22:[function(require,module,exports){
// Generic JavaScript utility methods

'use strict';

// Define a property that serves as an alias for another property.
exports.defineAlias = function (cls, origProperty, newProperty) {
    Object.defineProperty(cls.prototype, newProperty, {
        get: function () {
            return this[origProperty];
        },

        set: function (v) {
            this[origProperty] = v;
        }
    });
};

// Define a property on the class prototype that has a single getter function.
exports.defineGetter = function (cls, property, getterFn) {
    Object.defineProperty(cls.prototype, property, {
        get: getterFn
    });
};

},{}],23:[function(require,module,exports){
// Math Utility functions

'use strict';

var math = {};

math.sum = function (values) {
    var i,
        n = values.length,
        total = 0;
    for (i = 0; i < n; i += 1) {
        total += values[i];
    }
    return total;
};

math.round = function (x, decimals) {
    return (!decimals) ?
            Math.round(x) :
            Math.round(x * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

math.sign = function (x) {
    if (x < 0) { return -1; }
    if (x > 0) { return +1; }
    return 0;
};

math.degrees = function (radians) {
    return radians * 180 / Math.PI;
};

math.radians = function (degrees) {
    return degrees / 180 * Math.PI;
};

math.clamp = function (v, min, max) {
    if (min < max) {
        return v < min ? min : v > max ? max : v;
    } else {
        return v < max ? max : v > min ? min : v;
    }
};

// Snaps a value to a virtual grid. Distance defines the spacing between grid lines.
// Strength defines how strongly the values move to the grid. If 1, the values will always
// be on the grid lines, if 0, the value is unchanged.
math.snap = function (v, distance, strength) {
    strength = strength !== undefined ? strength : 1;
    return (v * (1.0 - strength)) + (strength * Math.round(v / distance) * distance);
};

math.dot = function (a, b) {
    var m = Math.min(a.length, b.length),
        n = 0,
        i;
    for (i = 0; i < m; i += 1) {
        n += a[i] * b[i];
    }
    return n;
};

// Linearly interpolate between from and to for t=0-1.
// If clamp=true, values outside of 0-1 will be clamped.
var _lerp = math.mix = math.lerp = function (from, to, t, clamp) {
    if (clamp) {
        if (t < 0) { return from; }
        if (t > 1) { return to; }
    }
    return from + (to - from) * t;
};

// Compute fade curve for point t.
function _fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

// Convert low 4 bits of hash code into 12 gradient directions.
function _grad(hash, x, y, z) {
    var h, u, v;
    h = hash & 15;
    u = h < 8 ? x : y;
    v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function _scale(n) {
    return (1 + n) / 2;
}

var _permutation = (function () {
    var permutation, p, i;
    permutation = [ 151, 160, 137, 91, 90, 15,
        131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
        190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
        88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
        77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
        102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
        135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
        5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
        223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
        129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
        251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
        49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];

    p = new Uint8Array(512);
    for (i = 0; i < 256; i += 1) {
        p[256 + i] = p[i] = permutation[i];
    }
    return p;
}());

// Calculate Perlin noise
math.noise = function (x, y, z) {
    var p = _permutation;

    // Find unit cube that contains the point.
    var X = Math.floor(x) & 255;
    var Y = Math.floor(y) & 255;
    var Z = Math.floor(z) & 255;
    // Find relative x, y, z point in the cube.
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    // Compute fade curves for each x, y, z.
    var u = _fade(x);
    var v = _fade(y);
    var w = _fade(z);

    // Hash coordinates of the 8 cube corners.
    var A = p[X] + Y;
    var AA = p[A] + Z;
    var AB = p[A + 1] + Z;
    var B = p[X + 1] + Y;
    var BA = p[B] + Z;
    var BB = p[B + 1] + Z;

    // Add blended results from 8 corners of the cube.
    return _scale(_lerp(_lerp(_lerp(_grad(p[AA], x, y, z),
        _grad(p[BA], x - 1, y, z), u),
        _lerp(_grad(p[AB], x, y - 1, z),
             _grad(p[BB], x - 1, y - 1, z), u), v),
        _lerp(_lerp(_grad(p[AA + 1], x, y, z - 1),
            _grad(p[BA + 1], x - 1, y, z - 1), u),
            _lerp(_grad(p[AB + 1], x, y - 1, z - 1),
                _grad(p[BB + 1], x - 1, y - 1, z - 1), u), v), w));
};

module.exports = math;

},{}],24:[function(require,module,exports){
// Pseudo-random generator

'use strict';

// Generate a random function that is seeded with the given value.
function generator(seed) {
    // Note: the generator didn't work with negative seed values, so here we
    // transform our original seed into a new (positive) seed value with which we
    // create a new generator.
    if (seed < 0) {
        var gen = generator(Math.abs(seed));
        for (var i = 0; i < 23; i += 1) {
            gen();
        }
        return generator(gen(0, 10000));
    }

    // Based on random number generator from
    // http://indiegamr.com/generate-repeatable-random-numbers-in-js/
    return function (min, max) {
        min = min || 0;
        max = max || 1;
        seed = (seed * 9301 + 49297) % 233280;
        var v = seed / 233280;
        return min + v * (max - min);
    };
}

exports.generator = generator;

},{}],25:[function(require,module,exports){
// SVG Parser

// The SVG engine uses code from the following libraries:
// - for parsing the main svg tree: two.js - http://jonobr1.github.io/two.js/
// - for constructing individual paths: canvg - https://code.google.com/p/canvg/
// - for constructing arcs: fabric.js - http://fabricjs.com

'use strict';

var _ = require('lodash');
var xmldom = require('xmldom');

var Color = require('../objects/color');
var Group = require('../objects/group');
var Path = require('../objects/path');
var Point = require('../objects/point');
var Transform = require('../objects/transform');

// var getReflection = function (a, b, relative) {
//     var theta,
//         d = geo.distance(a.x, a.y, b.x, b.y);

//     if (d <= 0.0001) {
//         return relative ? Point.ZERO : a;
//     }
//     theta = geo.angle(a.x, a.y, b.x, b.y);
//     return new Point(
//         d * Math.cos(theta) + (relative ? 0 : a.x),
//         d * Math.sin(theta) + (relative ? 0 : a.y)
//     );
// };

var trim = function (s) {
    return s.replace(/^\s+|\s+$/g, '');
};

var compressSpaces = function (s) {
    return s.replace(/[\s\r\t\n]+/gm, ' ');
};

var toNumberArray = function (s) {
    var i,
        a = trim(compressSpaces((s || '').replace(/,/g, ' '))).split(' ');
    for (i = 0; i < a.length; i += 1) {
        a[i] = parseFloat(a[i]);
    }
    return a;
};

var applySvgAttributes = function (node, shape) {
    var fill, stroke, strokeWidth, transforms, types, transform, i;

    if (shape.commands) {
        fill = 'black';
    }

    transforms = [];
    types = {};

    types.translate = function (s) {
        var a = toNumberArray(s),
            tx = a[0],
            ty = a[1] || 0;
        return new Transform().translate(tx, ty);
    };

    types.scale = function (s) {
        var a = toNumberArray(s),
            sx = a[0],
            sy = a[1] || sx;
        return new Transform().scale(sx, sy);
    };

    types.rotate = function (s) {
        var t,
            a = toNumberArray(s),
            r = a[0],
            tx = a[1] || 0,
            ty = a[2] || 0;
        t = new Transform();
        t = t.translate(tx, ty);
        t = t.rotate(r);
        t = t.translate(-tx, -ty);
        return t;
    };

    types.matrix = function (s) {
        var m = toNumberArray(s);
        return [m[0], m[1], 0, m[2], m[3], 0, m[4], m[5], 1];
    };

    _.each(node.attributes, function (v) {
        var property, data, type, s, d;
        property = v.nodeName;

        switch (property) {
        case 'transform':
            data = trim(compressSpaces(v.nodeValue)).replace(/\)(\s?,\s?)/g, ') ').split(/\s(?=[a-z])/);
            for (i = 0; i < data.length; i += 1) {
                type = trim(data[i].split('(')[0]);
                s = data[i].split('(')[1].replace(')', '');
                transform = types[type](s);
                transforms.push(transform);
            }
            break;
        case 'visibility':
//          elem.visible = !!v.nodeValue;
            break;
        case 'stroke-linecap':
//          elem.cap = v.nodeValue;
            break;
        case 'stroke-linejoin':
//          elem.join = v.nodeValue;
            break;
        case 'stroke-miterlimit':
//          elem.miter = v.nodeValue;
            break;
        case 'stroke-width':
//          elem.linewidth = parseFloat(v.nodeValue);
            strokeWidth = parseFloat(v.nodeValue);
            break;
        case 'stroke-opacity':
        case 'fill-opacity':
//          elem.opacity = v.nodeValue;
            break;
        case 'fill':
            fill = v.nodeValue;
            break;
        case 'stroke':
            stroke = v.nodeValue;
            break;
        case 'style':
            d = {};
            _.each(v.nodeValue.split(';'), function (s) {
                var el = s.split(':');
                d[el[0].trim()] = el[1];
            });
            if (d.fill) {
                fill = d.fill;
            }
            if (d.stroke) {
                stroke = d.stroke;
            }
            if (d['stroke-width']) {
                strokeWidth = parseFloat(d['stroke-width']);
            }
            break;
        }
    });


    fill = fill === undefined ? fill : Color.parse(fill);
    stroke = stroke === undefined ? stroke : Color.parse(stroke);

    transform = new Transform();
    for (i = 0; i < transforms.length; i += 1) {
        transform = transform.append(transforms[i]);
    }

    function applyAttributes(shape) {
        if (shape.commands) {
            var commands = transform.transformShape(shape).commands,
                f = (fill === undefined) ? shape.fill : fill,
                s = (stroke === undefined) ? shape.stroke : stroke,
                sw = (strokeWidth === undefined) ? shape.strokeWidth : strokeWidth;
            if (sw !== undefined) {
                sw *= transform.m[0];
            }
            return new Path(commands, f, s, sw);
        } else if (shape.shapes) {
            return new Group(_.map(shape.shapes, applyAttributes));
        }
    }

    return applyAttributes(shape);
};

var arcToSegments = function (x, y, rx, ry, large, sweep, rotateX, ox, oy) {
/*    argsString = _join.call(arguments);
    if (arcToSegmentsCache[argsString]) {
      return arcToSegmentsCache[argsString];
    } */
    var th, sinTh, cosTh, px, py, pl,
        a00, a01, a10, a11, x0, y0, x1, y1,
        d, sFactorSq, sFactor, xc, yc,
        th0, th1, thArc,
        segments, result, th2, th3, i;

    th = rotateX * (Math.PI / 180);
    sinTh = Math.sin(th);
    cosTh = Math.cos(th);
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    px = cosTh * (ox - x) * 0.5 + sinTh * (oy - y) * 0.5;
    py = cosTh * (oy - y) * 0.5 - sinTh * (ox - x) * 0.5;
    pl = (px * px) / (rx * rx) + (py * py) / (ry * ry);
    if (pl > 1) {
        pl = Math.sqrt(pl);
        rx *= pl;
        ry *= pl;
    }

    a00 = cosTh / rx;
    a01 = sinTh / rx;
    a10 = (-sinTh) / ry;
    a11 = cosTh / ry;
    x0 = a00 * ox + a01 * oy;
    y0 = a10 * ox + a11 * oy;
    x1 = a00 * x + a01 * y;
    y1 = a10 * x + a11 * y;

    d = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0);
    sFactorSq = 1 / d - 0.25;
    if (sFactorSq < 0) { sFactorSq = 0; }
    sFactor = Math.sqrt(sFactorSq);
    if (sweep === large) { sFactor = -sFactor; }
    xc = 0.5 * (x0 + x1) - sFactor * (y1 - y0);
    yc = 0.5 * (y0 + y1) + sFactor * (x1 - x0);

    th0 = Math.atan2(y0 - yc, x0 - xc);
    th1 = Math.atan2(y1 - yc, x1 - xc);

    thArc = th1 - th0;
    if (thArc < 0 && sweep === 1) {
        thArc += 2 * Math.PI;
    } else if (thArc > 0 && sweep === 0) {
        thArc -= 2 * Math.PI;
    }

    segments = Math.ceil(Math.abs(thArc / (Math.PI * 0.5 + 0.001)));
    result = [];
    for (i = 0; i < segments; i += 1) {
        th2 = th0 + i * thArc / segments;
        th3 = th0 + (i + 1) * thArc / segments;
        result[i] = [xc, yc, th2, th3, rx, ry, sinTh, cosTh];
    }

//    arcToSegmentsCache[argsString] = result;
    return result;
};

var segmentToBezier = function (cx, cy, th0, th1, rx, ry, sinTh, cosTh) {
//    argsString = _join.call(arguments);
//    if (segmentToBezierCache[argsString]) {
//      return segmentToBezierCache[argsString];
//    }

    var a00 = cosTh * rx,
        a01 = -sinTh * ry,
        a10 = sinTh * rx,
        a11 = cosTh * ry,

        thHalf = 0.5 * (th1 - th0),
        t = (8 / 3) * Math.sin(thHalf * 0.5) * Math.sin(thHalf * 0.5) / Math.sin(thHalf),
        x1 = cx + Math.cos(th0) - t * Math.sin(th0),
        y1 = cy + Math.sin(th0) + t * Math.cos(th0),
        x3 = cx + Math.cos(th1),
        y3 = cy + Math.sin(th1),
        x2 = x3 + t * Math.sin(th1),
        y2 = y3 - t * Math.cos(th1);

//    segmentToBezierCache[argsString] = [
    return [
        a00 * x1 + a01 * y1, a10 * x1 + a11 * y1,
        a00 * x2 + a01 * y2,      a10 * x2 + a11 * y2,
        a00 * x3 + a01 * y3,      a10 * x3 + a11 * y3
    ];

//    return segmentToBezierCache[argsString];
};

var read = {

    svg: function () {
        return read.g.apply(this, arguments);
    },

    g: function (node) {

        var shapes = [];

        _.each(node.childNodes, function (n) {

            var tag, tagName, o;
            tag = n.nodeName;
            if (!tag) { return; }
            tagName = tag.replace(/svg\:/ig, '').toLowerCase();
            if (read[tagName] !== undefined) {
                o = read[tagName].call(this, n);
                shapes.push(o);
            }
        });

        return applySvgAttributes(node, new Group(shapes));
    },

    polygon: function (node, open) {
        var points = node.getAttribute('points');
        var p = new Path();
        points.replace(/([\d\.?]+),([\d\.?]+)/g, function (match, p1, p2) {
            var x = parseFloat(p1);
            var y = parseFloat(p2);
            if (p.commands.length === 0) {
                p.moveTo(x, y);
            } else {
                p.lineTo(x, y);
            }
        });
        if (!open) {
            p.close();
        }
        return applySvgAttributes(node, p);
    },

    polyline: function (node) {
        return read.polygon(node, true);
    },

    rect: function (node) {
        var x = parseFloat(node.getAttribute('x'));
        var y = parseFloat(node.getAttribute('y'));
        var width = parseFloat(node.getAttribute('width'));
        var height = parseFloat(node.getAttribute('height'));
        var p = new Path();
        p.addRect(x, y, width, height);
        return applySvgAttributes(node, p);
    },

    ellipse: function (node) {
        var cx = parseFloat(node.getAttribute('cx'));
        var cy = parseFloat(node.getAttribute('cy'));
        var rx = parseFloat(node.getAttribute('rx'));
        var ry = parseFloat(node.getAttribute('ry'));
        var p = new Path();
        p.addEllipse(cx - rx, cy - ry, rx * 2, ry * 2);
        return applySvgAttributes(node, p);
    },

    circle: function (node) {
        var cx = parseFloat(node.getAttribute('cx'));
        var cy = parseFloat(node.getAttribute('cy'));
        var r = parseFloat(node.getAttribute('r'));
        var p = new Path();
        p.addEllipse(cx - r, cy - r, r * 2, r * 2);
        return applySvgAttributes(node, p);
    },

    line: function (node) {
        var x1 = parseFloat(node.getAttribute('x1'));
        var y1 = parseFloat(node.getAttribute('y1'));
        var x2 = parseFloat(node.getAttribute('x2'));
        var y2 = parseFloat(node.getAttribute('y2'));
        var p = new Path();
        p.addLine(x1, y1, x2, y2);
        return applySvgAttributes(node, p);
    },

    path: function (node) {
        var d, PathParser, pp,
            pt, newP, curr, p1, cntrl, cp, cp1x, cp1y, cp2x, cp2y,
            rx, ry, rot, large, sweep, ex, ey, segs, i, bez;
        // TODO: convert to real lexer based on http://www.w3.org/TR/SVG11/paths.html#PathDataBNF
        d = node.getAttribute('d');
        d = d.replace(/,/gm, ' '); // get rid of all commas
        d = d.replace(/([MmZzLlHhVvCcSsQqTtAa])([MmZzLlHhVvCcSsQqTtAa])/gm, '$1 $2'); // separate commands from commands
        d = d.replace(/([MmZzLlHhVvCcSsQqTtAa])([MmZzLlHhVvCcSsQqTtAa])/gm, '$1 $2'); // separate commands from commands
        d = d.replace(/([MmZzLlHhVvCcSsQqTtAa])([^\s])/gm, '$1 $2'); // separate commands from points
        d = d.replace(/([^\s])([MmZzLlHhVvCcSsQqTtAa])/gm, '$1 $2'); // separate commands from points
        d = d.replace(/([0-9])([+\-])/gm, '$1 $2'); // separate digits when no comma
        d = d.replace(/(\.[0-9]*)(\.)/gm, '$1 $2'); // separate digits when no comma
        d = d.replace(/([Aa](\s+[0-9]+){3})\s+([01])\s*([01])/gm, '$1 $3 $4 '); // shorthand elliptical arc path syntax
        d = compressSpaces(d); // compress multiple spaces
        d = trim(d);

        PathParser = function (d) {
            this.tokens = d.split(' ');

            this.reset = function () {
                this.i = -1;
                this.command = '';
                this.previousCommand = '';
                this.start = new Point(0, 0);
                this.control = new Point(0, 0);
                this.current = new Point(0, 0);
                this.points = [];
                this.angles = [];
            };

            this.isEnd = function () {
                return this.i >= this.tokens.length - 1;
            };

            this.isCommandOrEnd = function () {
                if (this.isEnd()) { return true; }
                return this.tokens[this.i + 1].match(/^[A-Za-z]$/) !== null;
            };

            this.isRelativeCommand = function () {
                switch (this.command) {
                case 'm':
                case 'l':
                case 'h':
                case 'v':
                case 'c':
                case 's':
                case 'q':
                case 't':
                case 'a':
                case 'z':
                    return true;
                }
                return false;
            };

            this.getToken = function () {
                this.i += 1;
                return this.tokens[this.i];
            };

            this.getScalar = function () {
                return parseFloat(this.getToken());
            };

            this.nextCommand = function () {
                this.previousCommand = this.command;
                this.command = this.getToken();
            };

            this.getPoint = function () {
                var pt = new Point(this.getScalar(), this.getScalar());
                return this.makeAbsolute(pt);
            };

            this.getAsControlPoint = function () {
                var pt = this.getPoint();
                this.control = pt;
                return pt;
            };

            this.getAsCurrentPoint = function () {
                var pt = this.getPoint();
                this.current = pt;
                return pt;
            };

            this.getReflectedControlPoint = function () {
                if (this.previousCommand.toLowerCase() !== 'c' &&
                        this.previousCommand.toLowerCase() !== 's' &&
                        this.previousCommand.toLowerCase() !== 'q' &&
                        this.previousCommand.toLowerCase() !== 't') {
                    return this.current;
                }

                // reflect point
                var pt = new Point(2 * this.current.x - this.control.x, 2 * this.current.y - this.control.y);
                return pt;
            };

            this.makeAbsolute = function (pt) {
                if (this.isRelativeCommand()) {
                    return new Point(pt.x + this.current.x, pt.y + this.current.y);
                }
                return pt;
            };
        };

        var p = new Path();

        pp = new PathParser(d);
        pp.reset();

        while (!pp.isEnd()) {
            pp.nextCommand();
            switch (pp.command) {
            case 'M':
            case 'm':
                pt = pp.getAsCurrentPoint();
                p.moveTo(pt.x, pt.y);
                pp.start = pp.current;
                while (!pp.isCommandOrEnd()) {
                    pt = pp.getAsCurrentPoint();
                    p.lineTo(pt.x, pt.y);
                }
                break;
            case 'L':
            case 'l':
                while (!pp.isCommandOrEnd()) {
                    pt = pp.getAsCurrentPoint();
                    p.lineTo(pt.x, pt.y);
                }
                break;
            case 'H':
            case 'h':
                while (!pp.isCommandOrEnd()) {
                    newP = new Point((pp.isRelativeCommand() ? pp.current.x : 0) + pp.getScalar(), pp.current.y);
                    pp.current = newP;
                    p.lineTo(pp.current.x, pp.current.y);
                }
                break;
            case 'V':
            case 'v':
                while (!pp.isCommandOrEnd()) {
                    newP = new Point(pp.current.x, (pp.isRelativeCommand() ? pp.current.y : 0) + pp.getScalar());
                    pp.current = newP;
                    p.lineTo(pp.current.x, pp.current.y);
                }
                break;
            case 'C':
            case 'c':
                while (!pp.isCommandOrEnd()) {
                    curr = pp.current;
                    p1 = pp.getPoint();
                    cntrl = pp.getAsControlPoint();
                    cp = pp.getAsCurrentPoint();
                    p.curveTo(p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
                }
                break;
            case 'S':
            case 's':
                while (!pp.isCommandOrEnd()) {
                    curr = pp.current;
                    p1 = pp.getReflectedControlPoint();
                    cntrl = pp.getAsControlPoint();
                    cp = pp.getAsCurrentPoint();
                    p.curveTo(p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
                }
                break;
            case 'Q':
            case 'q':
                while (!pp.isCommandOrEnd()) {
                    curr = pp.current;
                    cntrl = pp.getAsControlPoint();
                    cp = pp.getAsCurrentPoint();
                    cp1x = curr.x + 2 / 3 * (cntrl.x - curr.x); // CP1 = QP0 + 2 / 3 *(QP1-QP0)
                    cp1y = curr.y + 2 / 3 * (cntrl.y - curr.y); // CP1 = QP0 + 2 / 3 *(QP1-QP0)
                    cp2x = cp1x + 1 / 3 * (cp.x - curr.x); // CP2 = CP1 + 1 / 3 *(QP2-QP0)
                    cp2y = cp1y + 1 / 3 * (cp.y - curr.y); // CP2 = CP1 + 1 / 3 *(QP2-QP0)
                    p.curveTo(cp1x, cp1y, cp2x, cp2y, cp.x, cp.y);
                }
                break;
            case 'T':
            case 't':
                while (!pp.isCommandOrEnd()) {
                    curr = pp.current;
                    cntrl = pp.getReflectedControlPoint();
                    pp.control = cntrl;
                    cp = pp.getAsCurrentPoint();
                    cp1x = curr.x + 2 / 3 * (cntrl.x - curr.x); // CP1 = QP0 + 2 / 3 *(QP1-QP0)
                    cp1y = curr.y + 2 / 3 * (cntrl.y - curr.y); // CP1 = QP0 + 2 / 3 *(QP1-QP0)
                    cp2x = cp1x + 1 / 3 * (cp.x - curr.x); // CP2 = CP1 + 1 / 3 *(QP2-QP0)
                    cp2y = cp1y + 1 / 3 * (cp.y - curr.y); // CP2 = CP1 + 1 / 3 *(QP2-QP0)
                    p.curveTo(cp1x, cp1y, cp2x, cp2y, cp.x, cp.y);
                }
                break;
            case 'A':
            case 'a':
                while (!pp.isCommandOrEnd()) {
                    curr = pp.current;
                    rx = pp.getScalar();
                    ry = pp.getScalar();
                    rot = pp.getScalar();// * (Math.PI / 180.0);
                    large = pp.getScalar();
                    sweep = pp.getScalar();
                    cp = pp.getAsCurrentPoint();
                    ex = cp.x;
                    ey = cp.y;
                    segs = arcToSegments(ex, ey, rx, ry, large, sweep, rot, curr.x, curr.y);
                    for (i = 0; i < segs.length; i += 1) {
                        bez = segmentToBezier.apply(this, segs[i]);
                        p.curveTo.apply(this, bez);
                    }
                }
                break;
            case 'Z':
            case 'z':
                p.close();
                pp.current = pp.start;
                break;
            }
        }
        return applySvgAttributes(node, p);
    }
};

exports.interpret = function (svgNode) {
    var node,
        tag = svgNode.tagName.toLowerCase();
    if (read[tag] === undefined) {
        return null;
    }

    node = read[tag].call(this, svgNode);
    return node;
};

exports.parseString = function (s) {
    var doc = new xmldom.DOMParser().parseFromString(s);
    if (doc) {
        return exports.interpret(doc.documentElement);
    }
};

},{"../objects/color":9,"../objects/group":10,"../objects/path":12,"../objects/point":13,"../objects/transform":16,"lodash":2,"xmldom":3}],26:[function(require,module,exports){
// vg.js
// JavaScript library for vector graphics
// https://github.com/nodebox/vg.js
// (c) 2014 EMRG
// vg.js may be freely distributed under the MIT license.
// Based on: canvas.js, https://github.com/clips/pattern/blob/master/pattern/canvas.js (BSD)
// De Smedt T. & Daelemans W. (2012). Pattern for Python. Journal of Machine Learning Research.

'use strict';

var _ = require('lodash');

var vg = {};

// Utility functions
vg.bezier = require('./util/bezier');
vg.color = require('./util/color');
vg.geo = require('./util/geo');
vg.math = require('./util/math');
vg.random = require('./util/random');
vg.svg = require('./util/svg');

// Objects
vg.Color = require('./objects/color');
vg.Group = require('./objects/group');
vg.Matrix4 = require('./objects/matrix4');
vg.Path = require('./objects/path');
vg.Point = vg.Vec2 = require('./objects/point');
vg.Rect = require('./objects/rect');
vg.Text = require('./objects/text');
vg.Transform = vg.Matrix3 = require('./objects/transform');
vg.Vec3 = require('./objects/vec3');

// Commands
function importCommands(module) {
    for (var k in module) {
        vg[k] = module[k];
    }
}

var Transformable = require('./objects/transformable');
_.extend(vg.Point.prototype, Transformable);
_.extend(vg.Path.prototype, Transformable);
_.extend(vg.Group.prototype, Transformable);
_.extend(vg.Text.prototype, Transformable);

importCommands(require('./commands/draw'));
importCommands(require('./commands/filters'));
importCommands(require('./commands/shapes'));

module.exports = vg;
},{"./commands/draw":6,"./commands/filters":7,"./commands/shapes":8,"./objects/color":9,"./objects/group":10,"./objects/matrix4":11,"./objects/path":12,"./objects/point":13,"./objects/rect":14,"./objects/text":15,"./objects/transform":16,"./objects/transformable":17,"./objects/vec3":18,"./util/bezier":19,"./util/color":20,"./util/geo":21,"./util/math":23,"./util/random":24,"./util/svg":25,"lodash":2}]},{},[26])(26)
});