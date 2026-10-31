# ALITS CertiChain
## Project Report — Secure Digital Certificate Issuance and Verification System

**Stack:** MongoDB · Express.js · React · Node.js (MERN)  
**Institute (demo brand):** ALITS Institute of Excellence  
**Academic year:** 2025–26

---

### 1. Abstract

Physical and PDF certificates are easy to forge. ALITS CertiChain issues official digital certificates as QR-coded PDFs, stores a cryptographic seal (HMAC-SHA256 and RSA signature) in MongoDB, mines each hash into a local proof-of-work ledger, and can stamp the same hash on the **Ethereum Sepolia testnet**. Anyone can verify a certificate by uploading the PDF, scanning the QR, or entering the ID. The system returns a clear verdict: genuine, fake, tampered, or revoked.

---

### 2. Problem statement

Colleges, training institutes, and recruiters still rely on printed or emailed PDFs. A lookalike document with a changed name or course is hard to detect by eye. There is no public, instant way to confirm that a certificate was issued by the authority and has not been withdrawn.

### 3. Objectives

1. Generate unique, branded certificates (academic, workshop, internship) as PDFs with QR codes.  
2. Prevent tampering using HMAC-SHA256 and RSA digital signatures.  
3. Allow public verification without login.  
4. Support revocation without deleting history.  
5. Provide an admin dashboard (issue, registry, analytics, ledger).  
6. Give students a portal to download their own certificates.  
7. Anchor hashes on Ethereum Sepolia so the seal is independently auditable.

---

### 4. Proposed solution

Every genuine certificate receives:

- A unique ID (`ALITS-YYYY-XXXXXX`)
- An HMAC of canonical fields (id, name, course, date, issuer, template)
- An RSA signature from the institute key pair
- A QR encoding a short verify URL
- A local blockchain block
- An optional Sepolia transaction (contract `stamp` or calldata stamp)

Verification recomputes the hash, checks the signature, looks up status (active/revoked), and displays the official record.

---

### 5. System modules

| Module | Function |
| --- | --- |
| Certificate generation | Form → ID, hash, signature, QR, PDF, DB, ledger, Ethereum |
| QR generation | Short URL ` /verify?id=…&h=… ` |
| Verification | Upload PDF/photo, camera, or manual ID |
| Admin panel | JWT auth, CRUD, revoke, users |
| Analytics | Issued, genuine checks, fake attempts, charts |
| Local ledger | Linked blocks, difficulty 3 |
| Ethereum stamp | Sepolia tx visible on Etherscan |
| Student portal | List and download certificates for that email |

---

### 6. Users and roles

- **Superadmin (registrar)** — all certificates, issuers, analytics  
- **Issuer** — issue and revoke own certificates  
- **Student** — view/download own PDFs  
- **Public verifier** — no login  

Demo accounts: `admin@alits.edu` / `ALITS@2026`, `issuer@alits.edu` / `Issuer@2026`, `student@alits.edu` / `Student@2026`.

---

### 7. Database schema (MongoDB)

**Certificate:** certId, name, email, course, issueDate, issuer, issuerId, template, grade, hash, signature, status (active/revoked), qrPayload, pdfPath, chainIndex, chainHash, ethTxHash, ethNetwork.

**User:** name, email, password (bcrypt), role, organization, phone, notify flags.

**Block:** index, timestamp, certId, dataHash, previousHash, blockHash, nonce.

**VerificationLog:** certId, result, source (web/camera/upload/demo), ip, userAgent.

---

### 8. Security features

1. **Tamper detection** — HMAC-SHA256; any field change breaks the hash.  
2. **Digital signature** — RSA-SHA256; public key exposed for offline checks.  
3. **Revocation list** — status = revoked; record is kept.  
4. **JWT** — 7-day tokens for staff and students.  
5. **Rate limiting** — verification endpoint capped to reduce scraping.  
6. **On-chain stamp** — hash published to Sepolia so the registry cannot silently rewrite history without a new transaction.

---

### 9. Workflow

1. Issuer fills the form → system generates certificate.  
2. QR is created → official PDF is issued.  
3. Verifier uploads/scans/enters ID → backend checks DB + hash + signature.  
4. Match and active → **Genuine**.  
5. No match / hash mismatch → **Fake / Tampered**.  
6. Revoked → **Invalid — Revoked**.

---

### 10. Technology stack

| Layer | Choice |
| --- | --- |
| Frontend | React (Vite), Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB / Mongoose |
| PDF / QR | PDFKit, qrcode, pdfjs-dist, jsQR |
| Crypto | Node `crypto` (HMAC + RSA) |
| Blockchain | Local PoW + ethers.js (Sepolia) |
| Auth | JWT, bcrypt |

---

### 11. Ethereum Sepolia integration

Smart contract `HashRegistry.sol` stores `(certId → hash, issuer, timestamp)`.

If the contract is not yet deployed, the server still sends a **zero-value Sepolia transaction** whose calldata contains `ALITS|certId|hash`. Either way, the transaction hash is stored and opened on [Sepolia Etherscan](https://sepolia.etherscan.io).

Setup:

1. Open Ledger in the admin app to reveal the stamp wallet address.  
2. Fund it from a Sepolia faucet (free test ETH).  
3. Click **Stamp on Sepolia** (or issue a new certificate).  
4. Optional: `npm run deploy:sepolia --prefix server` then set `ETH_CONTRACT_ADDRESS`.

---

### 12. Testing / viva demo

| ID | Expected result |
| --- | --- |
| ALITS-2026-REAL01 | Valid — Genuine |
| FAKE-999-XXXX | Invalid / Fake |
| ALITS-2026-REVOK1 | Invalid — Revoked |

Also: issue a new PDF → upload on `/verify` → genuine. Ledger → stamp → open Etherscan.

---

### 13. Conclusion

CertiChain shows that QR verification plus cryptographic seals and a public testnet stamp can make academic certificates independently checkable. Forgery that only copies the visual design fails at the registry.

### 14. Future work

SMS/email in production, mobile app, mainnet or Polygon deployment, college SSO, multi-campus issuers.

---

**References (indicative):** SHA-256 (NIST), JWT (RFC 7519), Ethereum Yellow Paper, Sepolia test network documentation.
