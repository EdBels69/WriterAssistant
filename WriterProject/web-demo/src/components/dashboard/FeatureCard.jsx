import { ArrowRight } from 'lucide-react'

const FeatureCard = ({ feature, onClick }) => {
  const IconComponent = feature.icon
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(feature.id)
    }
  }

  return (
    <article
      className="academic-feature-card"
      onClick={() => onClick(feature.id)}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Открыть ${feature.title}`}
    >
      <div className="academic-feature-icon">
        <IconComponent size={24} aria-hidden="true" />
      </div>
      
      <div className="academic-feature-content">
        <h4 className="academic-feature-title">{feature.title}</h4>
        <p className="academic-feature-description">{feature.description}</p>
      </div>
      
      <div className="academic-feature-action">
        <ArrowRight size={16} aria-hidden="true" />
      </div>
    </article>
  )
}

export default FeatureCard