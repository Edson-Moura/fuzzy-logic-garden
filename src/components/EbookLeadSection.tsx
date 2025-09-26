import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import { Feedback } from '@/components/ui/feedback';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AdminEbookUpload from '@/components/AdminEbookUpload';

const EbookLeadSection = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
const { toast } = useToast();
  const isAdmin = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite seu email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    let duplicate = false;
    
    try {
      // Save lead to database
      const { error: leadError } = await supabase
        .from('ebook_leads')
        .insert({
          email: email.trim().toLowerCase(),
          name: name.trim() || null,
        });

      if (leadError) {
        // Tratar qualquer erro de conflito como duplicado e prosseguir com reenvio
        const msg = `${leadError.code || ''} ${leadError.message || ''} ${leadError.details || ''}`.toLowerCase();
        const isConflict = leadError.code === '23505' || msg.includes('duplicate') || msg.includes('already exists') || msg.includes('conflict') || leadError.code === '409';
        if (isConflict) {
          duplicate = true;
          console.log('Lead já existente, reenviando ebook. Erro:', leadError);
        } else {
          throw leadError;
        }
      }

      // Call edge function to send ebook
      console.log('Calling send-ebook function with:', { email: email.trim(), name: name.trim() });
      const { data, error: emailError } = await supabase.functions.invoke('send-ebook', {
        body: { email: email.trim(), name: name.trim() }
      });

      console.log('Send-ebook response:', { data, error: emailError });

      if (emailError) {
        console.error('Error sending ebook:', emailError);
        toast({
          title: "Erro no envio",
          description: "Houve um problema ao enviar o ebook. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setIsSuccess(true);
      toast({
        title: duplicate ? "Ebook reenviado" : "Sucesso!",
        description: duplicate
          ? "Reenviamos o ebook para seu email."
          : "Ebook enviado para seu email. Verifique sua caixa de entrada.",
      });
      
      // Reset form
      setEmail('');
      setName('');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro. Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <section className="py-16 px-4 bg-gradient-subtle">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="shadow-elegant border-primary/20">
            <CardContent className="p-8">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Ebook Enviado com Sucesso!</h3>
              <p className="text-muted-foreground mb-6">
                Verifique sua caixa de entrada (e spam) para baixar seu guia gratuito de inglês.
              </p>
              <Button 
                onClick={() => setIsSuccess(false)}
                variant="outline"
              >
                Cadastrar outro email
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gradient-section-neutral" id="ebook">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-primary/10">
              <BookOpen className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-destructive">10 Erros Comuns</span> <span className="bg-gradient-primary bg-clip-text text-transparent">de Aprendizado de Inglês e Como Evitá-los</span>
          </h2>
          <div className="max-w-2xl mx-auto mb-8">
            <p className="text-xl text-muted-foreground mb-4">
              Melhore seu inglês de forma rápida e eficiente ao evitar esses erros comuns.
            </p>
            <div className="p-4 rounded-lg bg-primary/10 border-l-4 border-primary">
              <p className="text-lg font-semibold text-primary">
                ✨ <span className="bg-primary/20 px-2 py-1 rounded">Download Instantâneo</span> - Receba agora mesmo em seu email!
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-start space-x-4 p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-glow">
                <span className="text-primary-foreground font-semibold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-foreground">
                  <span className="bg-accent/20 px-2 py-1 rounded text-accent-foreground">
                    Não Praticar a Pronúncia Correta
                  </span>
                </h3>
                <p className="text-muted-foreground">
                  Muitos estudantes ignoram a pronúncia ao aprenderem novas palavras
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-glow">
                <span className="text-primary-foreground font-semibold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-foreground">
                  <span className="bg-accent/20 px-2 py-1 rounded text-accent-foreground">
                    Focar Apenas em Gramática
                  </span>
                </h3>
                <p className="text-muted-foreground">
                  Balanceie o estudo da gramática com atividades práticas de conversação
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-lg bg-accent/10 border border-accent/20">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-glow">
                <span className="text-primary-foreground font-semibold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-foreground">
                  <span className="bg-accent/20 px-2 py-1 rounded text-accent-foreground">
                    Traduzir Diretamente do Português
                  </span>
                </h3>
                <p className="text-muted-foreground">
                  Traduzir palavra por palavra pode levar a construções gramaticais incorretas
                </p>
              </div>
            </div>
          </div>

          <Card className="shadow-elegant border-2 border-primary/30 bg-gradient-to-br from-card to-card/80 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-accent/20 rounded-full translate-y-8 -translate-x-8"></div>
            
            <CardHeader className="text-center relative z-10">
              <div className="inline-block p-2 bg-primary/10 rounded-full mb-3 mx-auto">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-3xl bg-gradient-primary bg-clip-text text-transparent">
                🎁 Baixe Gratuitamente
              </CardTitle>
              <CardDescription className="text-lg">
                <span className="font-semibold text-foreground">Digite seus dados para receber o ebook</span>
                <br />
                <span className="bg-accent/20 px-2 py-1 rounded text-accent-foreground font-medium">
                  📧 instantaneamente
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nome (opcional)</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Como você gostaria de ser chamado?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="border-2 focus:border-primary/50 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                    Email 
                    <span className="text-destructive font-bold">*</span>
                    <span className="bg-green/20 text-green px-1 py-0.5 rounded text-xs font-medium">Obrigatório</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="border-2 focus:border-primary/50 transition-all duration-300"
                  />
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse hover:animate-none"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        🚀 Baixar Ebook Gratuito Agora
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  <div className="w-2 h-2 bg-green rounded-full"></div>
                  <span>Seus dados estão protegidos. Não enviamos spam.</span>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <div className="flex justify-center items-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green" />
              Mais de 10.000 downloads
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green" />
              Conteúdo atualizado 2024
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green" />
              100% gratuito
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EbookLeadSection;