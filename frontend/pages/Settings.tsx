
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';

const Settings: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Configurações</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Preferências do Usuário</CardTitle>
                    <CardDescription>Gerencie suas preferências de tema, idioma e notificações.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tema</label>
                            <select className="w-full p-2 border rounded-md bg-transparent dark:border-dark-border">
                                <option>Claro</option>
                                <option>Escuro</option>
                                <option>Sistema</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Idioma</label>
                            <input type="text" value="Português (Brasil)" disabled className="w-full p-2 border rounded-md bg-gray-100 dark:bg-dark-border/50 dark:border-dark-border"/>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Metas</CardTitle>
                    <CardDescription>Defina as metas de produtividade e fechamentos para a equipe.</CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">Configurações de metas aqui.</p>
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader>
                    <CardTitle>Categorias</CardTitle>
                    <CardDescription>Gerencie as categorias utilizadas no sistema (financeiro, áreas do direito, etc).</CardDescription>
                </CardHeader>
                <CardContent>
                   <p className="text-sm text-muted-foreground">Gerenciamento de categorias aqui.</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;
