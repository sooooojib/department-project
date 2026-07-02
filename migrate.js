const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx')) {
                callback(dirPath);
            }
        }
    });
}

const targetDirs = [
    path.join(__dirname, 'app'),
    path.join(__dirname, 'components'),
];

targetDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        walkDir(dir, (filePath) => {
            let content = fs.readFileSync(filePath, 'utf8');

            if (content.includes('import { decrypt } from \'@/lib/auth\';') || content.includes('import { decrypt } from "@/lib/auth";')) {
                console.log('Migrating:', filePath);

                // Replace import
                content = content.replace(
                    /import\s+\{\s*decrypt\s*\}\s+from\s+['"]@\/lib\/auth['"];?/g,
                    `import { getServerSession } from 'next-auth';\nimport { authOptions } from '@/lib/authOptions';`
                );

                // Remove cookie logic
                content = content.replace(/const\s+cookieStore\s*=\s*await\s+cookies\(\);?\s*\n/g, '');
                content = content.replace(/const\s+token\s*=\s*req\.cookies\.get\(['"]token['"]\)\?\.value;?\s*\n/g, '');
                content = content.replace(/const\s+token\s*=\s*\(?await\s+cookies\(\)\)?\.get\(['"]token['"]\)\?\.value;?\s*\n/g, '');
                content = content.replace(/const\s+token\s*=\s*cookies\(\)\.get\(['"]token['"]\)\?\.value;?\s*\n/g, '');
                
                content = content.replace(/if\s*\(!token\)\s*return\s*NextResponse\.json\(\{.*\}\s*,\s*\{\s*status:\s*401\s*\}\);?\s*\n/g, '');
                content = content.replace(/if\s*\(!token\)\s*\{[^}]+\}\s*\n/g, '');
                
                // Replace decrypt with getServerSession
                // Typically: const payload = await decrypt(token); -> const payload = await getServerSession(authOptions);
                content = content.replace(/await\s+decrypt\(\s*(?:token)?\s*\)/g, 'await getServerSession(authOptions)');
                
                // Rename payload accessors
                content = content.replace(/\bpayload\.userId\b/g, 'payload?.user?.id');
                content = content.replace(/\bpayload\.role\b/g, 'payload?.user?.role');
                content = content.replace(/\bsession\?\.userId\b/g, 'session?.user?.id');
                content = content.replace(/\bsession\.userId\b/g, 'session?.user?.id');
                content = content.replace(/\bsession\?\.role\b/g, 'session?.user?.role');
                content = content.replace(/\bsession\.role\b/g, 'session?.user?.role');

                // Some routes might use `!payload` or `!payload.role`
                // `payload` becomes the session object, so `payload?.user` is the actual payload.
                // `if (!payload || !payload.role)` -> `if (!payload || !payload?.user?.role)`
                content = content.replace(/!payload\.role/g, '!payload?.user?.role');
                content = content.replace(/!session\.role/g, '!session?.user?.role');

                // For routes using `req.headers.get('x-user-id')` because middleware set it
                // Actually they might be using getServerSession now if they used decrypt.
                
                fs.writeFileSync(filePath, content, 'utf8');
            }
        });
    }
});

console.log('Migration script complete.');
