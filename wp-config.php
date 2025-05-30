<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized language
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

 $_SERVER['SERVER_PORT']	= '80';

 $_SERVER['HTTPS'] = 'on';
$_SERVER['HTTP_HOST'] = 'burmese.dvb.no';

define('EP_HOST', 'http://172.104.33.202');

define('WP_CACHE', false);

define('FS_METHOD', 'direct');

// define( 'WP_SITEURL', $protocol . $_SERVER['HTTP_HOST'] );
// define( 'WP_HOME', $protocol . $_SERVER['HTTP_HOST'] );

//define( 'WP_HOME', 'https://staging-burmese.dvb.no' );
//define( 'WP_SITEURL', 'https://staging-burmese.dvb.no' );

define( 'WP_HOME', 'https://burmese.dvb.no' );
define( 'WP_SITEURL', 'https://burmese.dvb.no' );



// define( 'WP_HOME', 'http://staging-burmese.dvb.no:8080' );
// define( 'WP_SITEURL', 'http://staging-burmese.dvb.no:8080' );

// define( 'WP_HOME', 'http://localhost' );
// define( 'WP_SITEURL', 'http://localhost' );

//define( 'WP_HOME', 'https://burmese.dvb.no' );
//define( 'WP_SITEURL', 'https://burmese.dvb.no' );


//define('WP_MEMORY_LIMIT', '256M');
define('WP_MEMORY_LIMIT', '1024M');
set_time_limit(120);

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'burmese_db' );
//define( 'DB_NAME', 'burmese_prev_db_a');

/** Database username */
//define( 'DB_USER', 'burmesedbuser3' );
define( 'DB_USER', 'root' );

/** Database password */
//define( 'DB_PASSWORD', 'd6NKCROUyqim3' );
define( 'DB_PASSWORD', 'Idunno1.' );

/** Database hostname */
define( 'DB_HOST', '127.0.0.1' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',          ',6`:rsLB%b>vEv~(E^x{l70Ut@ph/<uos}4<,c^y?Sim-?<yojdvh53f9;Q<>$mR' );
define( 'SECURE_AUTH_KEY',   '{7t,`, A0)0<hp9>q%jwxkmk3/67xUBL6k7W^)u%GZR$JWom$3@|cE{fE2$sePBU' );
define( 'LOGGED_IN_KEY',     '_}j&/8jR~0VemW~k|q#SWsp3|6:R/y+(v/(z@FF`q2}<F[w<D3(@Xe7g,0P4YI&J' );
define( 'NONCE_KEY',         'v@r`BfB3I]N; y1`MDG-z~|x@qx~q]Jt`B:JG[qUSa~PgYXoTbyM/|a`@;w2P(E5' );
define( 'AUTH_SALT',         '<-r(=bn 4,dFZ3yxx6z}qO;H1x-mr33N^IXqmy:hq=)U BC2tu+nEzyjnNO})54S' );
define( 'SECURE_AUTH_SALT',  '<CN6kvOuy:COH3GY$ndaXy@^Jp@A,|6b).Y#VfTGQ`Z.t[U~cQeZf+%u$b}@>&I&' );
define( 'LOGGED_IN_SALT',    '}:Ej?k/)(~9$-Q2)Prh3B` JpUAZ[CTV_#:mwhS[cmN4NxiPz+Q2B<S*iV2%K#Ee' );
define( 'NONCE_SALT',        '8dVjYE!/0p-6L1-NHuLvBpK@BH.E_~.~9V84K/u~J<$Q3==%b)_uzH~/XnQ<%<76' );
define( 'WP_CACHE_KEY_SALT', 'l1w[p<`_]65dmy,`w6DxTH*_#[2?-@U`[`kWpgja8~Ttf|E2N9:n}CmLN9we}yV;' );


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'dvp_';


/* Add any custom values between this line and the "stop editing" line. */

define('AUTOSAVE_INTERVAL', 86400);



/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
if ( ! defined( 'WP_DEBUG' ) ) {
	define( 'WP_DEBUG', false );
}

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
