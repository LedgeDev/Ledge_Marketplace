const prisma = require('../../prisma');
const express = require('express');
const { authenticate } = require('../../authentication');
const { fixVersionQueryLength, versionGreaterThan } = require('./utils');
const router = express.Router();

router.get('/', [], async (req, res) => {
  try {
    // if a version was requested in the query, return the version and the version info
    if (req.query.version) {
      const requestedVersion = fixVersionQueryLength(req.query.version);
      const requestedAppVersion = await prisma.app_versions.findFirst({
        where: {
          version: requestedVersion,
        },
      });

      // get versions and sort them by version number
      const versions = await prisma.app_versions.findMany({});
      versions.sort((a, b) => versionGreaterThan(b.version, a.version));
      const latestVersion = versions[0];
      const latestCriticalVersion = versions.find(
        (version) => version.critical,
      );

      let versionInfo = {
        updateRequired: false,
        latestVersion: latestVersion.version,
      };

      // If there is a critical version that is greater than the requested version, update is required
      if (
        latestCriticalVersion &&
        versionGreaterThan(latestCriticalVersion.version, requestedVersion) ===
          1
      ) {
        versionInfo = {
          updateRequired: true,
          latestVersion: latestVersion.version,
        };
      }
      res.json({ ...requestedAppVersion, versionInfo });
    } else {
      const versions = await prisma.app_versions
        .findMany({})
        .then((versions) => {
          versions.sort((a, b) => versionGreaterThan(a.version, b.version));
          return versions;
        });
      res.json(versions);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.post('/', [authenticate], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    } else {
      const newVersion = req.body;
      const appVersion = await prisma.app_versions.create({
        data: {
          version: newVersion.version,
          critical: newVersion.critical,
        },
      });
      res.status(201).json(appVersion);
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.patch('/:id', [authenticate], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    } else {
      const versionId = req.params.id;
      const data = req.body;
      const updatedVersion = await prisma.app_versions.update({
        where: {
          id: versionId,
        },
        data: data,
      });
      res.json(updatedVersion);
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.delete('/:id', [authenticate], async (req, res) => {
  try {
    if (req.user?.isAdmin !== 'true') {
      res.status(403).send('User is not an admin');
      return;
    } else {
      const versionId = req.params.id;
      await prisma.app_versions.delete({
        where: {
          id: versionId,
        },
      });
      res.status(200).send('App version deleted');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = {
  path: '/app-versions',
  router,
};
