import { Transport } from 'mediasoup-client/lib/types';
import { useEffect, useState } from 'react';

export default function Stats({ transport }: { transport: Transport; }) {
    const [stats, setStats] = useState<{ name: string; value: any; }[]>();

    useEffect(() => {
        async function handleStats() {
            const brutStats = await transport.getStats();
            const stats = Array.from(brutStats, ([name, value]) => ({ name, value }));
            setStats(stats);
        }

        const interval = setInterval(async () => handleStats(), 100);
        return () => clearInterval(interval);
    }, [transport]);

    if (!stats) {
        return (<>
            <p>Stats loading...</p>
        </>);
    }

    return (<>
        {stats.map(({ name, value }, key) => (
            <div key={key} style={{ width: '100%', padding: '5px' }}>
                <details>
                    <summary>{name}</summary>
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {JSON.stringify(value, null, 2)}
                    </div>
                </details>
            </div>
        ))}
    </>);
}