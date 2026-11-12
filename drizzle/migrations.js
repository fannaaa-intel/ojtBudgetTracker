// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_right_gargoyle.sql';
import m0001 from './0001_handy_mole_man.sql';
import m0002 from './0002_little_squadron_supreme.sql';
import m0003 from './0003_familiar_wiccan.sql';
import m0004 from './0004_freezing_eddie_brock.sql';
import m0005 from './0005_awesome_juggernaut.sql';
import m0006 from './0006_modern_psylocke.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006
    }
  }
  