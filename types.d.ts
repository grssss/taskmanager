declare module 'next-pwa' {
    import { NextConfig } from 'next';

    interface PWAConfig {
        dest?: string;
        disable?: boolean;
        register?: boolean;
        scope?: string;
        sw?: string;
        runtimeCaching?: any[];
        publicExcludes?: string[];
        buildExcludes?: string[];
        cacheOnFrontEndNav?: boolean;
        reloadOnOnline?: boolean;
        fallbacks?: {
            [key: string]: string;
        };
        [key: string]: any;
    }

    function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
    export default withPWA;
}
