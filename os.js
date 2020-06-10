const OS_WIN = 0;
const OS_LINUX = 1;
const OS_MAC = 2;
const OS_UNIX = 3;
const OS_UNKNOWN = 4;

/**
 * I really wrote this method to switch the writing head of the writer, but then I remembered...
 * ...its hardcoded into CSS... ah crap.
 * Keeping it, because it looks so professional *lol*
 */
function getOs()
{
    if (navigator.appVersion.indexOf("Win") != -1)
    {
        return OS_WIN;
    }
    
    if (navigator.appVersion.indexOf("Mac") != -1)
    {
        return OS_MAC;
    }

    if (navigator.appVersion.indexOf("X11") != -1)
    {
        return OS_UNIX;
    }

    if (navigator.appVersion.indexOf("Linux") != -1)
    {
        return OS_LINUX;
    }

    return OS_UNKNOWN;
}