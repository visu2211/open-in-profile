// Tiny launcher for the "Open Tab in Profile" companion helper.
//
// Why this exists: starting with macOS 26/27, Chrome's own data folder
// (~/Library/Application Support/Google/Chrome) is covered by Apple's
// Application Support protection (an allowlist in sandboxd, enforced via
// the com.apple.macl xattr). Access from anything else is denied silently
// (EPERM), with no permission prompt. Chrome launches native messaging
// hosts with TCC responsibility disclaimed, so a bare `python3 script.py`
// has no app identity a user could grant anything to.
//
// This launcher is the main executable of OpenInProfileHelper.app. It
// spawns the real Python helper as a child that inherits this bundle's
// TCC identity, so a one-time Full Disk Access grant to the .app covers
// the helper.

#include <mach-o/dyld.h>
#include <limits.h>
#include <signal.h>
#include <spawn.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>

extern char **environ;

static pid_t child = 0;

static void forward_signal(int sig) {
    if (child > 0) kill(child, sig);
}

int main(int argc, char **argv) {
    char exe[PATH_MAX];
    uint32_t size = sizeof(exe);
    if (_NSGetExecutablePath(exe, &size) != 0) {
        fprintf(stderr, "launcher: cannot resolve own path\n");
        return 1;
    }
    char real[PATH_MAX];
    if (!realpath(exe, real)) {
        fprintf(stderr, "launcher: realpath failed\n");
        return 1;
    }

    // .../OpenInProfileHelper.app/Contents/MacOS/OpenInProfileHelper
    //   -> .../OpenInProfileHelper.app/Contents/Resources/open_in_profile_host.py
    char *slash = strrchr(real, '/');
    if (slash) *slash = '\0';            // strip executable name
    slash = strrchr(real, '/');
    if (slash) *slash = '\0';            // strip "MacOS"

    char script[PATH_MAX];
    snprintf(script, sizeof(script), "%s/Resources/open_in_profile_host.py", real);

    // Build argv: python3 <script> <chrome args...>
    char **args = calloc((size_t)argc + 2, sizeof(char *));
    args[0] = "/usr/bin/python3";
    args[1] = script;
    for (int i = 1; i < argc; i++) args[i + 1] = argv[i];
    args[argc + 1] = NULL;

    signal(SIGTERM, forward_signal);
    signal(SIGINT, forward_signal);
    signal(SIGHUP, forward_signal);

    // stdin/stdout are inherited, which is exactly what native messaging needs.
    int rc = posix_spawn(&child, args[0], NULL, NULL, args, environ);
    if (rc != 0) {
        fprintf(stderr, "launcher: posix_spawn failed: %s\n", strerror(rc));
        return 1;
    }

    int status = 0;
    while (waitpid(child, &status, 0) < 0) {
        // retry on EINTR
    }
    if (WIFEXITED(status)) return WEXITSTATUS(status);
    if (WIFSIGNALED(status)) return 128 + WTERMSIG(status);
    return 0;
}
