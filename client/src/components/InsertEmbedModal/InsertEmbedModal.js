import i18n from 'i18n';
import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import FormBuilderModal from 'components/FormBuilderModal/FormBuilderModal';
import * as schemaActions from 'state/schema/SchemaActions';

const sectionConfigKey = 'SilverStripe\\AssetAdmin\\Controller\\AssetAdmin';

class InsertEmbedModal extends Component {
  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillMount() {
    this.setOverrides(this.props);
  }

  componentWillReceiveProps(props) {
    if (props.show && !this.props.show) {
      this.setOverrides(props);
    }
  }

  componentWillUnmount() {
    this.clearOverrides();
  }

  /**
   * Compares the current properties with received properties and determines if overrides need to be
   * cleared or added.
   *
   * @param {object} props
   */
  setOverrides(props) {
    if (this.props.schemaUrl !== props.schemaUrl) {
      this.clearOverrides();
    }
    if (props.schemaUrl) {
      const attrs = Object.assign({}, props.fileAttributes);
      delete attrs.ID;

      const overrides = {
        fields: Object.entries(attrs).map((field) => {
          const [name, value] = field;
          return { name, value };
        }),
      };
      // set overrides into redux store, so that it can be accessed by FormBuilder with the same
      // schemaUrl.
      this.props.actions.schema.setSchemaStateOverrides(props.schemaUrl, overrides);
    }
  }

  /**
   * Generates the properties for the modal
   *
   * @returns {object}
   */
  getModalProps() {
    const props = Object.assign(
      {
        handleSubmit: this.handleSubmit,
        onLoadingError: this.handleLoadingError,
        showErrorMessage: true,
        responseClassBad: 'alert alert-danger',
      },
      this.props,
      {
        bodyClassName: 'fill-height',
        className: `insert-embed-modal ${this.props.className}`,
        bsSize: 'lg',
        handleHide: this.props.onHide,
        title: ((this.props.targetUrl)
          ? i18n._t('InsertEmbedModal.EditTitle', 'Media from the web')
          : i18n._t('InsertEmbedModal.CreateTitle', 'Insert new media from the web')),
      }
    );
    delete props.onHide;
    delete props.sectionConfig;
    delete props.onInsert;
    delete props.fileAttributes;

    return props;
  }

  /**
   * Clear any overrides that may be in place
   */
  clearOverrides() {
    this.props.actions.schema.setSchemaStateOverrides(this.props.schemaUrl, null);
  }

  /**
   * Handler for when loading the form returns an error
   *
   * @param error
   */
  handleLoadingError(error) {
    if (typeof this.props.onLoadingError === 'function') {
      this.props.onLoadingError(error);
    }
  }

  /**
   * Capture submission in the form and stop the default submit behaviour
   *
   * @param data
   * @param action
   * @returns {Promise}
   */
  handleSubmit(data, action) {
    if (action === 'action_addmedia') {
      this.props.onCreate(data);
    }
    if (action === 'action_insertmedia') {
      this.props.onInsert(data);
    }
    if (action === 'action_cancel') {
      this.props.onHide();
    }

    return Promise.resolve();
  }

  render() {
    return <FormBuilderModal {...this.getModalProps()} />;
  }
}

InsertEmbedModal.propTypes = {
  sectionConfig: PropTypes.shape({
    url: PropTypes.string,
    form: PropTypes.object,
  }),
  show: PropTypes.bool,
  onInsert: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  fileAttributes: PropTypes.shape({
    Url: PropTypes.string,
    CaptionText: PropTypes.string,
    PreviewUrl: PropTypes.string,
    Placement: PropTypes.string,
    Width: PropTypes.number,
    Height: PropTypes.number,
  }),
  onHide: PropTypes.func.isRequired,
  className: PropTypes.string,
  actions: PropTypes.object,
  schemaUrl: PropTypes.string.isRequired,
  targetUrl: PropTypes.string,
  onLoadingError: PropTypes.func,
};

InsertEmbedModal.defaultProps = {
  className: '',
  fileAttributes: {},
};

function mapStateToProps(state, ownProps) {
  const sectionConfig = state.config.sections[sectionConfigKey];

  // get the schemaUrl to use as a key for overrides
  const targetUrl = ownProps.fileAttributes ? ownProps.fileAttributes.Url : '';
  const baseEditUrl = sectionConfig.form.remoteEditForm.schemaUrl;

  const editUrl = targetUrl && `${baseEditUrl}/?embedurl=${encodeURIComponent(targetUrl)}`;
  const createUrl = sectionConfig.form.remoteCreateForm.schemaUrl;

  const schemaUrl = editUrl || createUrl;

  return {
    sectionConfig,
    schemaUrl,
    targetUrl,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: {
      schema: bindActionCreators(schemaActions, dispatch),
    },
  };
}

export { InsertEmbedModal };

export default connect(mapStateToProps, mapDispatchToProps)(InsertEmbedModal);
