const FeaturesGrid = ({ features, onFeatureClick }) => {
  return (
    <section className="academic-features-section">
      <h3 className="academic-heading-3">Основные возможности</h3>
      
      <div className="academic-features-grid">
        {features.map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            onClick={onFeatureClick}
          />
        ))}
      </div>
    </section>
  )
}

export default FeaturesGrid