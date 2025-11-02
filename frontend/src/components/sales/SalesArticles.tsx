import React from 'react';
import styled from 'styled-components';
import { translateFinance } from '../../lib/translations';

const Container = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin-top: 1rem;
  overflow: hidden;
`;

const Header = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
`;

const Title = styled.h3`
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
`;

const ArticlesList = styled.div`
  max-height: 250px;
  overflow-y: auto;
  
  /* Personalizar la barra de scroll */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
  }
`;

const ArticleItem = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 2fr 1fr 1fr 1fr 0.5fr;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ArticleHeader = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 2fr 1fr 1fr 1fr 0.5fr;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 600;
  color: #495057;
  font-size: 0.875rem;
  text-transform: uppercase;
`;

const ArticleNumber = styled.span`
  font-weight: 600;
  color: #6c757d;
`;

const ConceptText = styled.span`
  color: #2c3e50;
`;

const QuantityText = styled.span`
  text-align: center;
  color: #495057;
`;

const AmountText = styled.span`
  text-align: right;
  font-weight: 600;
  color: #27ae60;
`;

const DeleteButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background-color 0.2s;
  
  &:hover {
    background: #c0392b;
  }
`;

const Summary = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
    padding-top: 0.5rem;
    border-top: 1px solid #dee2e6;
    font-weight: 700;
    font-size: 1.1rem;
  }
`;

const SummaryLabel = styled.span`
  color: #495057;
`;

const SummaryValue = styled.span`
  font-weight: 600;
  color: #2c3e50;
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
`;

export interface SalesArticle {
  id: string;
  description: string;
  concept: string;
  finance: string;
  imei?: string;
  paymentType: string;
  reference: string;
  amount: number;
  paymentAmount?: number;
  quantity: number;
}

interface SalesArticlesProps {
  articles: SalesArticle[];
  onDeleteArticle: (id: string) => void;
}

const SalesArticles: React.FC<SalesArticlesProps> = ({ articles, onDeleteArticle }) => {
  const totalArticles = articles.length;
  const subtotal = articles.reduce((sum, article) => sum + (article.amount * article.quantity), 0);
  const total = subtotal; // Por ahora el total es igual al subtotal, se pueden agregar impuestos después

  return (
    <Container>
      <Header>
        <Title>Artículos de la Venta</Title>
      </Header>
      
      {articles.length === 0 ? (
        <EmptyState>
          No hay artículos agregados a la venta
        </EmptyState>
      ) : (
        <>
          <ArticlesList>
            <ArticleHeader>
              <div>#</div>
              <div>Concepto</div>
              <div>Cantidad</div>
              <div>Precio Unit.</div>
              <div>Subtotal</div>
              <div>Acciones</div>
            </ArticleHeader>
            
            {articles.map((article, index) => (
              <ArticleItem key={article.id}>
                <ArticleNumber>{index + 1}</ArticleNumber>
                <ConceptText>
                  <div>{article.description}</div>
                  {article.imei && (
                    <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                      IMEI: {article.imei}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                    {article.concept} - {translateFinance(article.finance)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                    Referencia: {article.reference}
                  </div>
                </ConceptText>
                <QuantityText>{article.quantity}</QuantityText>
                <AmountText>${article.amount.toFixed(2)}</AmountText>
                <AmountText>${(article.amount * article.quantity).toFixed(2)}</AmountText>
                <DeleteButton onClick={() => onDeleteArticle(article.id)}>
                  ×
                </DeleteButton>
              </ArticleItem>
            ))}
          </ArticlesList>
          
          <Summary>
            <SummaryRow>
              <SummaryLabel>Número de artículos:</SummaryLabel>
              <SummaryValue>{totalArticles}</SummaryValue>
            </SummaryRow>
            <SummaryRow>
              <SummaryLabel>Subtotal:</SummaryLabel>
              <SummaryValue>${subtotal.toFixed(2)}</SummaryValue>
            </SummaryRow>
            <SummaryRow>
              <SummaryLabel>Total:</SummaryLabel>
              <SummaryValue>${total.toFixed(2)}</SummaryValue>
            </SummaryRow>
          </Summary>
        </>
      )}
    </Container>
  );
};

export default SalesArticles;
