const crypto = require('node:crypto');
const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const User = require('../models/User');

function generateDefaultPublicKey() {
  // Dummy COSE public key used to force uniform WebAuthn verification on failed logins.
  const { publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: { format: 'jwk' },
  });
  const x = Buffer.from(publicKey.x, 'base64url'); // 32 bytes
  const y = Buffer.from(publicKey.y, 'base64url'); // 32 bytes
  // COSE_Key: map(5) {1:2, 3:-7, -1:1, -2:x, -3:y}
  return Buffer.concat([Buffer.from([0xa5, 0x01, 0x02, 0x03, 0x26, 0x20, 0x01, 0x21, 0x58, 0x20]), x, Buffer.from([0x22, 0x58, 0x20]), y]);
}
const DUMMY_COSE_PUBLIC_KEY = generateDefaultPublicKey();

const rpName = 'Hackathon Starter';
const rpID = new URL(process.env.BASE_URL).hostname;
const expectedOrigin = new URL(process.env.BASE_URL).origin;

/**
 * POST /login/webauthn-start
 */
exports.postLoginStart = async (req, res) => {
  try {
    const { email, useEmailWithBiometrics } = req.body;
    req.session.webauthnLoginEmail = useEmailWithBiometrics && email ? email.toLowerCase().trim() : null;
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
    });
    req.session.loginChallenge = options.challenge;
    res.render('account/webauthn-login', {
      title: 'Biometric Login',
      publicKey: JSON.stringify(options),
    });
  } catch (err) {
    console.error('Error in postLoginStart:', err);
    req.flash('errors', { msg: 'Passkey / Biometric Failure.' });
    res.redirect('/login');
  }
};

/**
 * POST /login/webauthn-verify
 */
exports.postLoginVerify = async (req, res) => {
  try {
    let noUserFound = false;
    const { credential } = req.body;
    const expectedChallenge = req.session.loginChallenge;
    const scopedEmail = req.session.webauthnLoginEmail;
    delete req.session.webauthnLoginEmail;
    if (!credential || !expectedChallenge) {
      delete req.session.loginChallenge;
      req.flash('errors', { msg: 'Passkey / Biometric authentication failed - invalid request.' });
      return res.redirect('/login');
    }
    const parsedCredential = JSON.parse(credential);
    const credentialId = Buffer.from(parsedCredential.id, 'base64url');
    const user = await User.findOne({ 'webauthnCredentials.credentialId': credentialId });
    let userCredential;
    if (!user) {
      noUserFound = true;
      userCredential = { credentialId: credentialId, publicKey: DUMMY_COSE_PUBLIC_KEY, counter: 0, transports: [] };
    } else {
      userCredential = user.webauthnCredentials.find((c) => c.credentialId.equals(credentialId));
    }
    const verification = await verifyAuthenticationResponse({
      response: parsedCredential,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false,
      credential: {
        id: userCredential.credentialId,
        publicKey: userCredential.publicKey,
        counter: userCredential.counter,
        transports: userCredential.transports,
      },
    });
    delete req.session.loginChallenge;
    if (!verification.verified || noUserFound || (scopedEmail && user.email !== scopedEmail)) {
      if (scopedEmail) {
        req.flash('errors', { msg: 'Passkey / Biometric authentication failed, or did not match the provided email.' });
      } else {
        req.flash('errors', { msg: 'Passkey / Biometric authentication failed.' });
      }
      return res.redirect('/login');
    }
    userCredential.counter = verification.authenticationInfo.newCounter;
    userCredential.lastUsedAt = new Date();
    await user.save();
    req.logIn(user, (err) => {
      if (err) {
        console.error('Error in postLoginVerify - Login session error:', err);
        req.flash('errors', { msg: 'Login failed. Please try again.' });
        return res.redirect('/login');
      }
      req.flash('success', { msg: 'Success! You are logged in.' });
      res.redirect(req.session.returnTo || '/');
    });
  } catch (err) {
    console.error('Error in postLoginVerify:', err);
    delete req.session.loginChallenge;
    req.flash('errors', { msg: 'Passkey / Biometric authentication failed - system error.' });
    res.redirect('/login');
  }
};

/**
 * POST /account/webauthn/register
 */
exports.postRegisterStart = async (req, res) => {
  try {
    const { user } = req;
    if (!user.emailVerified) {
      req.flash('errors', { msg: 'Please verify your email address before enabling passkey login.' });
      return res.redirect('/account');
    }
    if (!user.webauthnUserID) {
      user.webauthnUserID = crypto.randomBytes(32);
      await user.save();
    }
    const existingCredentials = (user.webauthnCredentials || []).map((cred) => ({
      id: cred.credentialId,
      type: 'public-key',
      transports: cred.transports,
    }));
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: user.webauthnUserID,
      userName: user.email,
      userDisplayName: user.profile?.name || user.email,
      excludeCredentials: existingCredentials,
      authenticatorSelection: {
        residentKey: 'discouraged',
        userVerification: 'preferred',
      },
    });
    req.session.registerChallenge = options.challenge;
    res.render('account/webauthn-register', {
      title: 'Enable Biometric Login',
      publicKey: JSON.stringify(options),
    });
  } catch (err) {
    console.error('Error in postRegisterStart:', err);
    req.flash('errors', { msg: 'Failed to start passkey registration. Please try again.' });
    res.redirect('/account');
  }
};

/**
 * POST /account/webauthn/verify
 */
exports.postRegisterVerify = async (req, res) => {
  try {
    if (!req.user.emailVerified) {
      req.flash('errors', { msg: 'Please verify your email address before enabling passkey login.' });
      return res.redirect('/account');
    }
    const { credential } = req.body;
    const expectedChallenge = req.session.registerChallenge;
    if (!credential || !expectedChallenge) {
      delete req.session.registerChallenge;
      req.flash('errors', { msg: 'Registration failed. Please try again.' });
      return res.redirect('/account');
    }
    const parsedCredential = JSON.parse(credential);
    const verification = await verifyRegistrationResponse({
      response: parsedCredential,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });
    delete req.session.registerChallenge;
    if (!verification?.verified || !verification.registrationInfo?.credential) {
      req.flash('errors', { msg: 'Registration failed. Please try again.' });
      return res.redirect('/account');
    }
    const c = verification.registrationInfo.credential;
    if (!c.id || !c.publicKey) {
      console.error('Error in postRegisterVerify - registrationInfo payload:', verification.registrationInfo);
      req.flash('errors', { msg: 'Registration failed. Please try again.' });
      return res.redirect('/account');
    }
    req.user.webauthnCredentials = Array.isArray(req.user.webauthnCredentials) ? req.user.webauthnCredentials : [];

    const newCredentialId = Buffer.from(c.id, 'base64url');
    const alreadyOnUser = req.user.webauthnCredentials.some((cred) => Buffer.isBuffer(cred.credentialId) && cred.credentialId.equals(newCredentialId));
    if (alreadyOnUser) {
      req.flash('errors', { msg: 'This passkey is already registered to your account.' });
      return res.redirect('/account');
    }

    req.user.webauthnCredentials.push({
      credentialId: newCredentialId,
      publicKey: Buffer.from(c.publicKey),
      counter: typeof c.counter === 'number' ? c.counter : 0,
      transports: Array.isArray(c.transports) ? c.transports : [],
      deviceType: verification.registrationInfo.credentialDeviceType,
      backedUp: Boolean(verification.registrationInfo.credentialBackedUp),
      deviceName: 'Biometric Device',
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });
    try {
      await req.user.save();
    } catch (err) {
      if (err.code === 11000) {
        req.flash('errors', { msg: 'This passkey is already registered to an account.' });
        return res.redirect('/account');
      }
      throw err;
    }
    req.flash('success', { msg: 'Biometric login has been enabled successfully.' });
    return res.redirect('/account');
  } catch (err) {
    console.error('Error in postRegisterVerify:', err);
    delete req.session.registerChallenge;
    req.flash('errors', { msg: 'Registration failed. Please try again.' });
    return res.redirect('/account');
  }
};

/**
 * POST /account/webauthn/remove
 */
exports.postRemove = async (req, res) => {
  try {
    req.user.webauthnCredentials = [];
    req.user.webauthnUserID = undefined;
    await req.user.save();
    req.flash('success', { msg: 'Biometric login has been removed successfully.' });
    res.redirect('/account');
  } catch (err) {
    console.error('Error in postRemove:', err);
    req.flash('errors', { msg: 'Failed to remove biometric login. Please try again.' });
    res.redirect('/account');
  }
};
